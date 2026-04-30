import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { timelines, registrationSteps, votingMethods, generalInfo } from './data.js';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function startWebServer() {
  const app = express();
  const PORT = process.env.PORT || 8080; // Cloud Run requires listening on PORT

  // Middleware to parse JSON
  app.use(express.json());

  // Serve static files from 'public' directory
  app.use(express.static(path.join(__dirname, 'public')));

  // API endpoints to serve election data
  app.get('/api/election-data', (req, res) => {
    res.json({
      timelines,
      registrationSteps,
      votingMethods,
      generalInfo
    });
  });

  // Voter Registration API endpoint (Mocked DB save)
  app.post('/api/register', async (req, res) => {
    const formData = req.body;
    
    // Simulate network and DB delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log(chalk.green('\n📝 New Voter Registration Received:'));
    console.log(chalk.cyan(`Name:`), formData.fullName);
    console.log(chalk.cyan(`DOB:`), formData.dob);
    console.log(chalk.cyan(`Level/Grade:`), formData.level);
    console.log(chalk.cyan(`Email:`), formData.email);
    console.log(chalk.cyan(`Address:`), formData.address);
    console.log(chalk.gray('-----------------------------------------\n'));

    res.json({ 
        success: true, 
        message: 'Registration submitted successfully!' 
    });
  });

  // Chatbot API endpoint
  app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    
    if (!process.env.GEMINI_API_KEY) {
        console.warn(chalk.yellow('Warning: GEMINI_API_KEY is not set. Using fallback mock responder.'));
        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let reply = "I'm a simulated assistant. Please provide your API key in the environment variables (GEMINI_API_KEY) to use the real AI!";
        if (userMessage) {
            const lowerMsg = userMessage.toLowerCase();
            if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
                reply = "Hello there! How can I help you with the election guide today? (Mock Response)";
            } else if (lowerMsg.includes('register') || lowerMsg.includes('vote')) {
                reply = "You can find registration and voting information in the tabs above. (Mock Response)";
            } else if (lowerMsg.includes('deadline') || lowerMsg.includes('when')) {
                reply = "Check out the 'Timelines & Deadlines' tab for important dates. (Mock Response)";
            } else {
                reply = `You said: "${userMessage}". I'm currently in mock mode. Please add your GEMINI_API_KEY.`;
            }
        }
        return res.json({ reply });
    }

    try {
        const ai = new GoogleGenAI({}); // Automatically picks up process.env.GEMINI_API_KEY
        
        const systemInstruction = `
You are the Election Assistant AI, a helpful, friendly, and knowledgeable assistant for our interactive election guide app.
Your goal is to answer user questions about the election using ONLY the context provided below. Be concise and conversational.
Do not make up any dates or facts that are not in the provided data.

If a user asks to contact someone for further information, direct them to:
Name: Kennedy Effoh
Role: Senior School Administrator
Email: kennedyeffoh1@gmail.com

CONTEXT:
--- General Information ---
${generalInfo}

--- Timelines and Deadlines ---
${JSON.stringify(timelines, null, 2)}

--- Registration Steps ---
${JSON.stringify(registrationSteps, null, 2)}

--- Voting Methods ---
${JSON.stringify(votingMethods, null, 2)}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error(chalk.red('Error calling Gemini API:'), error);
        res.json({ reply: "I'm sorry, I encountered an error while processing your request. Please try again later." });
    }
  });

  // Fallback to index.html for all other requests (SPA-like behavior)
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(chalk.green(`\n✅ Web server successfully started!`));
    console.log(chalk.cyan(`🌐 Access the Election Guide at: `) + chalk.underline(`http://localhost:${PORT}`));
    console.log(chalk.gray(`Press Ctrl+C to stop the server.\n`));
  });
}

async function startCLI() {
  console.clear();
  console.log(chalk.blue.bold('\n=== Interactive CLI Election Guide ===\n'));

  while (true) {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'What would you like to learn about?',
        choices: [
          'Timelines & Deadlines',
          'How to Register',
          'Voting Methods',
          'General Information',
          new inquirer.Separator(),
          'Back to Main Menu'
        ]
      }
    ]);

    console.clear();
    console.log(chalk.blue.bold(`\n--- ${choice} ---\n`));

    switch (choice) {
      case 'Timelines & Deadlines':
        timelines.forEach(item => {
          console.log(chalk.yellow.bold(item.event) + chalk.gray(` (${item.date})`));
          console.log(`  ${item.description}\n`);
        });
        break;
      case 'How to Register':
        registrationSteps.forEach(step => {
          console.log(chalk.cyan(step));
        });
        console.log('');
        break;
      case 'Voting Methods':
        votingMethods.forEach(method => {
          console.log(chalk.magenta.bold(method.method));
          console.log(`  ${method.details}\n`);
        });
        break;
      case 'General Information':
        console.log(chalk.white(generalInfo) + '\n');
        break;
      case 'Back to Main Menu':
        return mainMenu();
    }

    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...'
      }
    ]);
    console.clear();
    console.log(chalk.blue.bold('\n=== Interactive CLI Election Guide ===\n'));
  }
}

async function mainMenu() {
  console.clear();
  console.log(chalk.bgBlue.white.bold('\n Welcome to the Election Assistant! \n'));
  
  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'How would you like to explore the guide?',
      choices: [
        { name: '🖥️  Command Line Interface (CLI)', value: 'cli' },
        { name: '🌐  Start Web Server (GUI)', value: 'web' },
        { name: '❌  Exit', value: 'exit' }
      ]
    }
  ]);

  if (mode === 'cli') {
    await startCLI();
  } else if (mode === 'web') {
    console.log(chalk.gray('\nStarting web server...'));
    startWebServer();
  } else {
    console.log(chalk.yellow('\nGoodbye! Remember to vote! 🗳️\n'));
    process.exit(0);
  }
}

// Start application
if (process.env.K_SERVICE || process.env.PORT) {
  // If running in Cloud Run or PORT is explicitly provided, bypass CLI and start web server
  startWebServer();
} else {
  mainMenu().catch(err => {
    console.error(chalk.red('An error occurred:'), err);
    process.exit(1);
  });
}
