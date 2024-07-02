import os

def identify_server():
    user_type = os.getenv('SERVER_ID', 'default')
    return server_id

def serve_files(server_id):
    files_to_serve = {
        'server_dev': 'server_id/file1.txt',
        'server_qa': 'server_id/file2.txt',
        'prod': 'server_id/file3.txt',
        'default': 'default/file.txt'
    }
    file_path = files_to_serve.get(server_id, files_to_serve['default'])
    print(f"Serving file: {file_path}")

if __name__ == "__main__":
    server_id = identify_user()
    serve_files(server_id)
