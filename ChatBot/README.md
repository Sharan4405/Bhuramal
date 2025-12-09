# ChatBot
Whatsapp Chatbot for bhuramal bhagirath prasad  

## Run the Express server

1. Install dependencies:

```powershell
npm install
```

2. Start the server:

```powershell
npm start
```

3. Open http://localhost:3000/ (or use curl / a browser). The root endpoint returns a JSON status object. There's also a `/health` endpoint that returns a plain "alive" string.

Notes:
- Development use: `npm run dev` (requires `nodemon`, included in devDependencies).
