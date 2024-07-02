import os

def identify_server():
    server_id = os.getenv('SERVER_ID', 'default')
    return server_id

def serve_files(server_id):
    files_to_serve = {
        'server_dev': 'server_dev/install1.txt',
        'server_qa': 'server_qa/install2.txt',
        'server_prod': 'server_prod/install3.txt',
        'default': 'default/file.txt'
    }
    file_path = files_to_serve.get(server_id, files_to_serve['default'])
    print(f"Serving file: {file_path}")

if __name__ == "__main__":
    server_id = identify_server()
    serve_files(server_id)
