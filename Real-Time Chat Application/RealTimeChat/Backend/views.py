from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import datetime
import db

# Initialize the database and load sample data
db.init_db()

# ==================== User Management ====================

@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            full_name = data.get('full_name')
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            profile_image = data.get('profile_image', 'profile.png')
            
            if not full_name or not username or not email or not password:
                return JsonResponse({"error": "Missing required fields"}, status=400)
                
            conn = db.get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            existing = cursor.fetchone()
            if existing:
                conn.close()
                return JsonResponse({"error": "Username already exists"}, status=400)
                
            user_id = data.get('user_id')
            if user_id:
                cursor.execute('''
                    INSERT INTO users (user_id, full_name, username, email, password, profile_image)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (user_id, full_name, username, email, password, profile_image))
            else:
                cursor.execute('''
                    INSERT INTO users (full_name, username, email, password, profile_image)
                    VALUES (?, ?, ?, ?, ?)
                ''', (full_name, username, email, password, profile_image))
                user_id = cursor.lastrowid
                
            conn.commit()
            
            # Fetch created user
            cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
            user = cursor.fetchone()
            conn.close()
            
            return JsonResponse(dict(user), status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def login_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                return JsonResponse({"error": "Username and password required"}, status=400)
                
            conn = db.get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password))
            user = cursor.fetchone()
            conn.close()
            
            if user:
                return JsonResponse(dict(user), status=200)
            else:
                return JsonResponse({"error": "Invalid username or password"}, status=401)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def get_users(request):
    if request.method == 'GET':
        users = db.get_all_users()
        return JsonResponse(users, safe=False)
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def update_user(request, user_id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            full_name = data.get('full_name')
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            profile_image = data.get('profile_image')
            
            conn = db.get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
            user = cursor.fetchone()
            if not user:
                conn.close()
                return JsonResponse({"error": "User not found"}, status=404)
                
            cursor.execute('''
                UPDATE users
                SET full_name = ?, username = ?, email = ?, password = ?, profile_image = ?
                WHERE user_id = ?
            ''', (
                full_name or user['full_name'],
                username or user['username'],
                email or user['email'],
                password or user['password'],
                profile_image or user['profile_image'],
                user_id
            ))
            conn.commit()
            
            cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
            updated_user = cursor.fetchone()
            conn.close()
            
            return JsonResponse(dict(updated_user), status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def delete_user(request, user_id):
    if request.method == 'DELETE':
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
            user = cursor.fetchone()
            if not user:
                conn.close()
                return JsonResponse({"error": "User not found"}, status=404)
                
            cursor.execute('DELETE FROM users WHERE user_id = ?', (user_id,))
            conn.commit()
            conn.close()
            return JsonResponse({"message": "User deleted successfully"}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)


# ==================== Chat Management ====================

@csrf_exempt
def send_message(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            sender = data.get('sender')
            receiver = data.get('receiver')
            message = data.get('message')
            sent_at = data.get('sent_at')
            
            if not sender or not receiver or not message:
                return JsonResponse({"error": "Missing required fields"}, status=400)
                
            if not sent_at:
                sent_at = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                
            conn = db.get_connection()
            cursor = conn.cursor()
            
            chat_id = data.get('chat_id')
            if chat_id:
                cursor.execute('''
                    INSERT INTO chats (chat_id, sender, receiver, message, sent_at)
                    VALUES (?, ?, ?, ?, ?)
                ''', (chat_id, sender, receiver, message, sent_at))
            else:
                cursor.execute('''
                    INSERT INTO chats (sender, receiver, message, sent_at)
                    VALUES (?, ?, ?, ?)
                ''', (sender, receiver, message, sent_at))
                chat_id = cursor.lastrowid
                
            conn.commit()
            
            cursor.execute('SELECT * FROM chats WHERE chat_id = ?', (chat_id,))
            chat = cursor.fetchone()
            conn.close()
            
            return JsonResponse(dict(chat), status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def get_chats(request):
    if request.method == 'GET':
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM chats')
        chats = cursor.fetchall()
        conn.close()
        return JsonResponse([dict(chat) for chat in chats], safe=False)
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def update_message(request, chat_id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            new_message = data.get('message')
            
            if not new_message:
                return JsonResponse({"error": "Message content required"}, status=400)
                
            conn = db.get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM chats WHERE chat_id = ?', (chat_id,))
            chat = cursor.fetchone()
            if not chat:
                conn.close()
                return JsonResponse({"error": "Message not found"}, status=404)
                
            cursor.execute('UPDATE chats SET message = ? WHERE chat_id = ?', (new_message, chat_id))
            conn.commit()
            
            cursor.execute('SELECT * FROM chats WHERE chat_id = ?', (chat_id,))
            updated_chat = cursor.fetchone()
            conn.close()
            
            return JsonResponse(dict(updated_chat), status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def delete_message(request, chat_id):
    if request.method == 'DELETE':
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM chats WHERE chat_id = ?', (chat_id,))
            chat = cursor.fetchone()
            if not chat:
                conn.close()
                return JsonResponse({"error": "Message not found"}, status=404)
                
            cursor.execute('DELETE FROM chats WHERE chat_id = ?', (chat_id,))
            conn.commit()
            conn.close()
            return JsonResponse({"message": "Message deleted successfully"}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)


# ==================== Conversation Management ====================

@csrf_exempt
def get_conversations(request):
    if request.method == 'GET':
        sender = request.GET.get('sender')
        conn = db.get_connection()
        cursor = conn.cursor()
        
        if sender:
            # Find all users that the 'sender' has exchanged messages with
            cursor.execute('''
                SELECT DISTINCT CASE 
                    WHEN sender = ? THEN receiver 
                    ELSE sender 
                END AS chat_partner
                FROM chats
                WHERE sender = ? OR receiver = ?
            ''', (sender, sender, sender))
            partners = cursor.fetchall()
            partner_list = [p['chat_partner'] for p in partners]
            
            conversations = []
            for partner in partner_list:
                cursor.execute('SELECT * FROM users WHERE username = ?', (partner,))
                user_row = cursor.fetchone()
                if user_row:
                    user_dict = dict(user_row)
                    user_dict.pop('password', None) # Hide password
                    
                    # Fetch the last message exchanged
                    cursor.execute('''
                        SELECT * FROM chats
                        WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
                        ORDER BY sent_at DESC LIMIT 1
                    ''', (sender, partner, partner, sender))
                    last_msg_row = cursor.fetchone()
                    if last_msg_row:
                        user_dict['last_message'] = dict(last_msg_row)
                    conversations.append(user_dict)
            
            conn.close()
            return JsonResponse(conversations, safe=False)
        else:
            # Return all unique conversation pairs in the database
            cursor.execute('''
                SELECT DISTINCT 
                    CASE WHEN sender < receiver THEN sender ELSE receiver END AS user1,
                    CASE WHEN sender < receiver THEN receiver ELSE sender END AS user2
                FROM chats
            ''')
            pairs = cursor.fetchall()
            conn.close()
            return JsonResponse([dict(pair) for pair in pairs], safe=False)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def get_conversation_history(request, username):
    if request.method == 'GET':
        sender = request.GET.get('sender')
        conn = db.get_connection()
        cursor = conn.cursor()
        
        if sender:
            # Fetch messages exchanged between sender and username
            cursor.execute('''
                SELECT * FROM chats
                WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
                ORDER BY sent_at ASC
            ''', (sender, username, username, sender))
        else:
            # Fallback: get all messages where username is sender or receiver
            cursor.execute('''
                SELECT * FROM chats
                WHERE sender = ? OR receiver = ?
                ORDER BY sent_at ASC
            ''', (username, username))
            
        chats = cursor.fetchall()
        conn.close()
        return JsonResponse([dict(c) for c in chats], safe=False)
        
    return JsonResponse({"error": "Method not allowed"}, status=405)
