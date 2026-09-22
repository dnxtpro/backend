import paramiko

host = "151.80.147.14"
username = "debian"
password = "Locoplaya2002"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("Connecting...")
ssh.connect(host, username=username, password=password)

print("Creating scripts directory on remote server if it doesn't exist...")
ssh.exec_command("mkdir -p /var/www/pipestats.iafailal.app/backend/scripts")

sftp = ssh.open_sftp()
local_path = "scripts/add_demo_user.js"
remote_path = "/var/www/pipestats.iafailal.app/backend/scripts/add_demo_user.js"
print(f"Uploading {local_path} to {remote_path}")
sftp.put(local_path, remote_path)
sftp.close()

print("Running add demo user script on remote server...")
stdin, stdout, stderr = ssh.exec_command("cd /var/www/pipestats.iafailal.app/backend && NODE_ENV=production node scripts/add_demo_user.js")
out = stdout.read().decode()
err = stderr.read().decode()

print("STDOUT:", out)
print("STDERR:", err)

ssh.close()
print("Done!")
