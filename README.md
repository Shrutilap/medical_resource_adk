# Medical Resource Allocation Agent

An intelligent SQL agent powered by Google Gemini 2.0 Flash that converts natural language queries into SQL, executes them, and learns from user preferences over time using LangChain and LangGraph.

## Features

- **Natural Language to SQL**: Convert plain English questions into SQL queries
- **Preference Learning**: Agent learns and remembers user preferences (cost sensitivity, coverage needs, etc.)
- **Two Modes**: 
  - Simple mode for basic SQL queries
  - Enhanced mode with long-term preference storage
- **Interactive CLI**: User-friendly command-line interface
- **Session Memory**: Maintains conversation context across queries
- **Query Evaluation**: Validates SQL results against user intent

## Prerequisites

- Python 3.8+
- MySQL installed and running
- Google API key (for Gemini)

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/Shrutilap/froncort_adk.git
git checkout langchain-backend
```
2. **Set Up Python Environment**

```bash
# Create and activate virtual environment
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Install MySQL connector** (required for MySQL database access)
```bash
pip install mysql-connector-python
```

4. **Set up environment variables**

Create a `.env` file in the project root with the following:

```env
# Google Gemini API
GOOGLE_API_KEY=your_google_api_key_here

# MySQL Database Configuration
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_HOST=your_mysql_host
DB_NAME=your_database_name
```

**To get a Google API key:**
- Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- Sign in with your Google account
- Create a new API key
- Copy and paste it into your `.env` file

### Import Database
```bash
mysql -u root -p hospital_data < mock_pune_50_hospitals.sql
```
Enter your MySQL root password when prompted.

## Usage

### Running the Agent

```bash
python sql_agent.py
```

You'll be presented with three modes:

### Mode 1: Simple SQL Agent
Basic query mode without preference learning.

```
Enter choice: 1
💬 Enter query: Fetch me hospitals running low on oxygen
```

### Mode 2: Enhanced SQL Agent (Recommended)
Includes preference learning and long-term memory.

```
Enter choice: 2
Enter your user ID: alice

💬 Enter your query: Fetch me hospitals running low on oxygen
```

The agent will:
1. Load your saved preferences
2. Generate appropriate SQL
3. Execute and return results
4. Learn from your feedback

**Available commands:**
- Type your question in natural language
- `prefs` - View your saved preferences
- `clear` - Start a new conversation with a new user ID
- `q` - Quit

### Mode 3: Example Queries
Runs demonstration queries to show the agent's capabilities.



## Project Structure

```
.
├── sql_agent.py              # Main agent code
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (create this)
├── user_preferences.db       # SQLite DB for preferences (auto-created)
└── README.md                 # This file
```

## Key Components

### Tools Available to the Agent

1. **get_user_priorities**: Retrieve saved user preferences
2. **update_user_priority**: Save new preferences from feedback
3. **rewrite_user_query**: Clarify ambiguous queries
4. **evaluate_sql_result**: Validate query accuracy
5. **sql_db_list_tables**: List all database tables
6. **sql_db_schema**: Get table schemas
7. **sql_db_query**: Execute SQL queries
8. **sql_db_query_checker**: Validate SQL syntax

### Memory Systems

- **Session Memory**: Short-term conversation context using LangGraph's MemorySaver
- **Long-term Preferences**: User preferences stored in SQLite (`user_preferences.db`)


