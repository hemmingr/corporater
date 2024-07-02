import os

def identify_user():
    user_type = os.getenv('USER_TYPE', 'default')
    return user_type

def serve_files(user_type):
    files_to_serve = {
        'user_type_1': 'user_type_1/file1.txt',
        'user_type_2': 'user_type_2/file2.txt',
        'user_type_3': 'user_type_3/file3.txt',
        'default': 'default/file.txt'
    }
    file_path = files_to_serve.get(user_type, files_to_serve['default'])
    print(f"Serving file: {file_path}")

if __name__ == "__main__":
    user_type = identify_user()
    serve_files(user_type)
