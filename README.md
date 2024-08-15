## Content

#### Full automation

Create a folder in your local computer

copy and past this two file

IMPORTANT!!! in the main.tf write your own pem key without .pem extension
main.tf

```shell

provider "aws" {
  region = "us-east-1"
}

# Fetch the default VPC
data "aws_vpc" "default" {
  default = true
}

# Create a security group with SSH access
resource "aws_security_group" "allow_ssh" {
  vpc_id = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_ssh"
  }
}

# Create IAM Role
resource "aws_iam_role" "admin_role" {
  name = "EC2AdminRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Attach AdministratorAccess policy to the IAM Role
resource "aws_iam_role_policy_attachment" "admin_role_policy_attachment" {
  role       = aws_iam_role.admin_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# Create an instance profile to attach the role to the EC2 instance
resource "aws_iam_instance_profile" "admin_instance_profile" {
  name = "EC2AdminInstanceProfile"
  role = aws_iam_role.admin_role.name
}

# Create the EC2 instance
resource "aws_instance" "webserver" {
  ami           = "ami-0ba9883b710b05ac6"
  instance_type = "t3.medium"
  key_name      = "Your-pem-key" # Ensure put your pem key

  # Attach the instance profile
  iam_instance_profile = aws_iam_instance_profile.admin_instance_profile.name

  # Use the provided UserData script
  user_data = file("userdata.sh")

  # Associate the security group
  security_groups = [aws_security_group.allow_ssh.name]

  tags = {
    Name = "main-instance"
  }
}

output "instance_id" {
  value = aws_instance.webserver.id
}

output "public_ip" {
  value = aws_instance.webserver.public_ip
}



```

userdata.sh

````shell

#!/bin/bash
# Log all output to /var/log/user-data.log
exec > /var/log/user-data.log 2>&1

# Update the package index
dnf update -y

# Install Git
dnf install git -y

# Install dnf-plugins-core to manage repositories
dnf install -y dnf-plugins-core

# Add HashiCorp Linux repository
dnf config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo

# Install Terraform
dnf install terraform -y

# Install Node.js 20.x from NodeSource repository
curl -sL https://rpm.nodesource.com/setup_20.x | bash -
dnf install nodejs -y

# Clone the repository
git clone https://github.com/yucel1993/NodeTypescriptBasicAuthentication.git

# Change directory to the cloned repository
cd NodeTypescriptBasicAuthentication/

# Add secret key to the lambda function
sed -i 's/<Your-secret-key>/e4a8b7c2d1f8e3b4c5d6e7f8a9b0c1d2e4a8b7c2d1f8e3b4c5d6e7f8a9b0c1d2/' main.tf

# Navigate to the lambda directory
cd lambda/

# Create .env file with required environment variables
echo 'ENCRYPTION_KEY=e4a8b7c2d1f8e3b4c5d6e7f8a9b0c1d2e4a8b7c2d1f8e3b4c5d6e7f8a9b0c1d2' > .env
echo 'USERS_TABLE=Users' >> .env

# Install dependencies
npm install

# Compile TypeScript to JavaScript
npx tsc

# Create the zip package and wait terminal
npm run deploy

# Go back to the main directory
cd ..

# Initialize Terraform
terraform init

# Deploy AWS Infrastructure
terraform apply --auto-approve

```
````

`terraform init`
`terraform apply auto-approve`

Please wait untill seeing health checks in in aws console (5 minutes)

### You need API to check the system

https://XXXXXXXX.execute-api.us-east-1.amazonaws.com/dev/auth

### Learn your api whose name is AuthAPI

Type in the terminal to learn your AuthAPI Id

`aws apigateway get-rest-apis`

You will get similar object in the terminal
{
"items": [
{
"id": "54drqcvc1j", // Get the id of this AuthAPI object
"name": "AuthAPI",
"description": "API for user authentication",
"createdDate": "2024-08-03T10:46:46+02:00",  
 "apiKeySource": "HEADER",
"endpointConfiguration": {
"types": [
"EDGE"
]
},
"disableExecuteApiEndpoint": false,
"rootResourceId": "65zeftmts6"
}
]
}

and grab "id": "54drqcvc1j", use in the following

https://54drqcvc1j.execute-api.us-east-1.amazonaws.com/dev/auth

Test credentials are :

- Username: `testuser`
- Password: `testpassword`

don't forget to delete resources in the webserver instance so make remote-ssh and destroy all resorces then you can destroy webserver instance
