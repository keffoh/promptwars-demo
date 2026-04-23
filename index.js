import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { timelines, registrationSteps, votingMethods, generalInfo } from './data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function startWebServer() {
  const app = express();
  const PORT = process.env.PORT || 8080; // Cloud Run requires listening on PORT

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
