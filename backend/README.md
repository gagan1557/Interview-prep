# Interview Preparation Platform - Server

## MongoDB Connection Setup

Since the application now relies exclusively on the MongoDB connection string from the environment variables, you need to set up the connection string before starting the server:

### Option 1: Create a .env file

Create a .env file in the server directory with the following content:

```
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/interview-platform?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

Replace `your_username`, `your_password`, and `your_cluster` with your actual MongoDB Atlas credentials.

### Option 2: Set environment variables directly

Set the environment variables in your terminal before starting the server:

Windows (Command Prompt):
```
set MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/interview-platform?retryWrites=true&w=majority
set JWT_SECRET=your_jwt_secret_key
```

Windows (PowerShell):
```
$env:MONGODB_URI="mongodb+srv://your_username:your_password@your_cluster.mongodb.net/interview-platform?retryWrites=true&w=majority"
$env:JWT_SECRET="your_jwt_secret_key"
```

### Option 3: Use MongoDB Atlas

1. Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Click "Connect" on your cluster
4. Choose "Connect your application"
5. Copy the connection string and replace `<password>` with your database user password
6. Use this string as your MONGODB_URI value

## Starting the Server

Once you've set up the MongoDB connection string, start the server with:

```
npm start
``` 