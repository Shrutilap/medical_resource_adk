# Froncort - Medical Resource Allocation Agent

## Prerequisites

- MySQL installed and running
- Python 3.8+
- Node.js and npm

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone -b main https://github.com/Shrutilap/froncort_adk.git
cd froncort_adk
```

### 2. Import Database
```bash
mysql -u root -p hospital_data < mock_pune_50_hospitals.sql
```
Enter your MySQL root password when prompted.

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=hospital_data
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GEMINI_API_KEY = YOUR_GEMINI_API_KEY
```

### 4. Set Up Python Environment

```bash
# Create and activate virtual environment
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 5. Set Up React Frontend

```bash
cd ui
npm install
cd ..
```

### 6. Run the Application

**Start Backend:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Start Frontend (in new terminal):**
```bash
cd ui
npm run dev
```

---

## Access the Application

- Frontend: http://localhost:5173/
- Backend: http://localhost:8000/

---

## Project Structure

```
froncort_adk/
├── sql_agent/                     # Backend SQL agent logic
├── ui/                            # React frontend
├── mock_pune_50_hospitals.sql     # Database setup file
├── database_gen.py                # Database generation script
├── requirements.txt               # Python dependencies
├── .env                           # Environment variables (create this) (Refer .env.example)
├── main.py                        # FASTAPI server
└── README.md                      # This file
```


## Problem Approach

### Challenge
Healthcare administrators often need to query complex hospital databases but may not have SQL expertise. Traditional database interfaces require technical knowledge and can be time-consuming. Key challenges include:

- **Technical Barrier**: Administrators need SQL knowledge to extract insights from hospital databases
- **Time Constraints**: Writing and debugging SQL queries takes valuable time during critical situations
- **Data Complexity**: Hospital databases have multiple interconnected tables with complex relationships
- **Error-Prone Queries**: Manual SQL writing leads to syntax errors and incorrect results
- **Lack of Context**: Raw SQL results don't provide meaningful insights without interpretation

### Solution
We developed a multi-agent system that bridges the gap between natural language and database queries through intelligent automation:

#### 1. **Natural Language Understanding**
- Accepts questions in plain English (e.g., "Which hospitals have available ICU beds?")
- No SQL knowledge required from end users
- Conversational interface for intuitive interaction

#### 2. **Intelligent SQL Generation**
- Automatically analyzes database schema before generating queries
- Creates optimized SQL queries based on user intent
- Handles complex joins and aggregations automatically

#### 3. **Query Validation & Refinement**
- **Prompt Rewriting**: Converts ambiguous queries into clear, structured requests
- **Result Evaluation**: Validates that query results match user intent
- **Iterative Improvement**: Refines queries if initial results are incomplete

#### 4. **Human-Readable Responses**
- Translates raw database results into natural language
- Provides context and insights, not just data
- Removes technical jargon from responses

### Key Features

#### Schema-Aware Query Generation
The system first retrieves and analyzes the complete database schema, understanding:
- Table structures and relationships
- Column names and data types
- Foreign key constraints
- Available data points

This ensures generated SQL queries are syntactically correct and semantically meaningful.

#### Multi-Agent Orchestration
Rather than a single monolithic system, we employ specialized agents:
- **Root Agent**: Orchestrates the entire workflow
- **Rewrite Agent**: Clarifies ambiguous user queries
- **Evaluation Agent**: Validates result accuracy
- **Function Tools**: Handle schema retrieval and query execution

#### Error Handling & Recovery
- Automatic retry logic for database connections
- Session recovery on failures
- Graceful error messages to users
- Comprehensive logging for debugging

#### Conversational Context
- Maintains conversation history across queries
- Understands follow-up questions
- Supports multi-turn dialogues
- Session-based user interactions

### Workflow
```
User Query → Schema Retrieval → Query Rewriting → SQL Generation 
→ Query Execution → Result Evaluation → Natural Language Response
```

**Step-by-Step Process:**

1. **User Input**: Administrator asks "Which hospitals have oxygen levels below 5000 liters?"

2. **Schema Loading**: System retrieves database structure to understand available tables and columns

3. **Query Refinement**: Rewrite agent clarifies the query to "List hospitals where available_oxygen_liters < 5000"

4. **SQL Generation**: Root agent creates:
```sql
   SELECT hospital_name, available_oxygen_liters 
   FROM hospitals h
   JOIN hospital_resource_timeseries hrt ON h.hospital_id = hrt.hospital_id
   WHERE hrt.available_oxygen_liters < 5000
   ORDER BY available_oxygen_liters ASC;
```

5. **Execution**: Query runs against the MySQL database

6. **Validation**: Evaluation agent confirms results answer the original question

7. **Response**: System returns: "3 hospitals currently have oxygen levels below 5000 liters: Ruby Hill Hospital (2,768 liters), Pune NMC Hospital (3,743 liters), and Narhe Hospital (2,370 liters)."

### Advantages Over Traditional Approaches

| Traditional SQL Interface | Froncort Agent System |
|--------------------------|----------------------|
| Requires SQL expertise | No technical knowledge needed |
| Manual schema exploration | Automatic schema analysis |
| Trial-and-error query writing | Intelligent query generation |
| Raw data output | Natural language responses |
| No validation | Built-in result verification |
| Single-shot queries | Conversational interaction |

### Impact

- **Reduced Query Time**: From minutes to seconds
- **Increased Accessibility**: Non-technical staff can access data
- **Improved Accuracy**: Automated validation reduces errors
- **Better Decision Making**: Quick insights enable faster responses to resource shortages
- **Scalability**: System handles complex queries across 50+ hospitals effortlessly

## Data Sources

### Overview
The Froncort system operates on a comprehensive mock hospital resource database specifically designed to simulate real-world healthcare data for 50 hospitals across Pune, Maharashtra. All data is synthetically generated to ensure privacy while maintaining realistic distributions and relationships.

### Data Generation Process

#### Mock Data Creation (`database_gen.py`)
I developed a Python script that generates statistically realistic hospital data using:

- **NumPy**: For random distributions and statistical modeling
- **Pandas**: For data structuring and manipulation
- **Seed Value (7777)**: Ensures reproducible data generation
- **Geographic Coordinates**: Centered around Pune (18.5204°N, 73.8567°E)

**Key Generation Parameters:**
- 50 hospitals with varied sizes (small: 45%, medium: 40%, large: 15%)
- Ownership distribution (government: 55%, private: 40%, trust: 5%)
- Realistic capacity ranges based on hospital size
- Geographic spread within Pune metropolitan area (±0.03° variation)
- Normal distributions for occupancy rates and resource utilization

#### Output
The script generates `mock_pune_50_hospitals.sql` - a complete MySQL dump ready for import.

---

### Database Schema

The system uses a **relational database** (`hospital_data`) with 5 interconnected tables:

---

### 1. **Hospitals Table**
**Purpose**: Core hospital metadata and location information

**Structure**:
```sql
CREATE TABLE hospitals (
  hospital_id VARCHAR(50) PRIMARY KEY,
  hospital_name VARCHAR(100),
  region VARCHAR(50),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  ownership_type VARCHAR(20),
  max_capacity_beds INT,
  ward_capacity_beds INT
);
```

**Data Characteristics**:
- **50 hospitals** with unique IDs (PUNE_001 to PUNE_050)
- **Real Pune-based names**: Ruby Hill Hospital, Sahyadri General Hospital, Kothrud District Hospital, etc.
- **Geographic distribution**: Latitude/longitude coordinates within Pune boundaries
- **Ownership types**: Government (govt), Private, Trust
- **Capacity ranges**:
  - Small hospitals: 25-120 beds
  - Medium hospitals: 80-400 beds
  - Large hospitals: 200-800 beds
- **Ward capacity**: ~68% of total bed capacity on average

**Example Data**:
```
PUNE_001 | Ruby Hill Hospital, Pune | Pune | 18.476612 | 73.858906 | trust | 145 | 98
PUNE_004 | Pune Central Medical Centre | Pune | 18.493835 | 73.871409 | private | 538 | 365
```

---

### 2. **Hospital Resource Timeseries Table**
**Purpose**: Real-time operational snapshot of hospital resources and capacity

**Structure**:
```sql
CREATE TABLE hospital_resource_timeseries (
  timestamp DATETIME,
  hospital_id VARCHAR(50),
  occupied_beds INT,
  total_beds INT,
  ed_total_beds INT,
  ed_occupied_beds INT,
  ward_capacity_beds INT,
  total_icu_beds INT,
  icu_occupied_beds INT,
  total_ventilators INT,
  in_use_ventilators INT,
  oxygen_units_liters FLOAT,
  available_oxygen_liters FLOAT,
  estimated_daily_consumption_oxygen_liters FLOAT,
  tb_med_stock_tablets INT,
  diag_kits_available INT,
  available_staff_count INT,
  on_shift_doctors INT,
  required_doctors INT,
  on_shift_nurses INT,
  ambulance_arrivals_24h INT,
  critical_cases_ed INT,
  avg_daily_admissions_7d FLOAT,
  avg_ed_tat_minutes_1h FLOAT,
  avg_ed_tat_minutes_6h FLOAT,
  PRIMARY KEY (timestamp, hospital_id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id)
);
```

**Data Categories**:

#### Bed Capacity & Utilization
- **Total beds**: Maximum hospital capacity
- **Occupied beds**: Current patients (varies by hospital size)
- **ED beds**: Emergency department capacity (8.5-14% of total)
- **ICU beds**: Intensive care capacity (3.5-7% of total)
- **Utilization rates**: Small (60%), Medium (74%), Large (86%) hospitals

#### Critical Equipment
- **Ventilators**: Total units and in-use counts
  - Total: 70-150% of ICU bed count
  - Utilization: ~69% on average (±15% variation)
- **Oxygen supply**:
  - Available oxygen: 1.5-6x daily consumption rate
  - Daily consumption: Based on ICU patients (380-520 L/patient) + general patients (4-12 L/patient)

#### Medical Supplies
- **TB medication stock**: 2,000-4,000 tablets per hospital
- **Diagnostic kits**: 5-50 kits available

#### Staffing Metrics
- **Available staff**: 50-400 personnel
- **Doctors on shift**: 10-60 doctors
- **Required doctors**: 15-80 (showing gaps)
- **Nurses on shift**: 20-120 nurses

#### Patient Flow Indicators
- **Ambulance arrivals**: 0-200 in last 24 hours
- **Critical cases in ED**: 0-50 patients
- **Average admissions**: 10-200 per day (7-day rolling average)
- **ED turnaround time**: 15-60 minutes (varies by timeframe)

**Generation Logic**:
- Occupancy follows normal distributions based on hospital size
- Resource utilization varies realistically (not all at 100%)
- Single timestamp snapshot per hospital (current state)

---

### 3. **Hospital Finance Monthly Table**
**Purpose**: Financial performance and budget tracking per hospital

**Structure**:
```sql
CREATE TABLE hospital_finance_monthly (
  hospital_id VARCHAR(50),
  year INT,
  month INT,
  period DATE,
  total_expenditure DECIMAL(15,2),
  operational_expenditure DECIMAL(15,2),
  staff_cost DECIMAL(15,2),
  supply_cost DECIMAL(15,2),
  maintenance_cost DECIMAL(15,2),
  transport_cost DECIMAL(15,2),
  capital_expenditure DECIMAL(15,2),
  revenue DECIMAL(15,2),
  budget_allocated DECIMAL(15,2),
  budget_remaining DECIMAL(15,2),
  data_confidence VARCHAR(20),
  last_updated DATETIME,
  PRIMARY KEY (hospital_id, period)
);
```

**Financial Breakdown**:

#### Expenditure Components
- **Total expenditure**: ₹1M - ₹9M per month (varies by hospital size)
- **Operational expenditure**: ~90% of total expenditure
  - **Staff costs**: 50-70% of total (largest expense)
  - **Supply costs**: 10-20% of total (medical supplies, equipment)
  - **Maintenance**: 2-6% of total (facility upkeep)
  - **Transport**: 1-3% of total (ambulances, logistics)
- **Capital expenditure**: 5-10% of total (new equipment, infrastructure)

#### Revenue & Budget
- **Revenue**: 60-120% of expenditure (some hospitals profitable, others subsidized)
- **Budget allocated**: 120% of expenditure (buffer for contingencies)
- **Budget remaining**: 20% of allocation on average

**Data Period**: October 2025 (2025-10-01)

**Example Data**:
```
PUNE_001 | 2025 | 10 | 2025-10-01 | ₹7,944,555 | ₹7,171,174 | ₹4,843,280 | ₹1,111,065 | ...
```

---

### 4. **Suppliers Table**
**Purpose**: Vendor information for medical supply chain management

**Structure**:
```sql
CREATE TABLE suppliers (
  vendor_id VARCHAR(20) PRIMARY KEY,
  vendor_name VARCHAR(100),
  vendor_type VARCHAR(50),
  contact JSON,
  lead_time_days INT,
  payment_terms_days INT
);
```

**Data**:
- **3 vendors** representing different supply categories:

| Vendor ID | Vendor Name | Type | Lead Time | Payment Terms |
|-----------|-------------|------|-----------|---------------|
| 100000001 | OxySupply Pvt Ltd | distributor | 2 days | 30 days |
| 100000002 | MedEquip Traders | manufacturer | 6 days | 45 days |
| 100000003 | Rapid Diagnostics Co | labkits | 3 days | 30 days |

**Contact Information**: Stored as JSON with phone and email
```json
{"phone": "+91-20-55550001", "email": "sales@oxysupply.in"}
```

---

### 5. **Inventory Items Table**
**Purpose**: Medical supply catalog and reorder parameters

**Structure**:
```sql
CREATE TABLE inventory_items (
  item_id VARCHAR(50) PRIMARY KEY,
  item_name VARCHAR(100),
  unit VARCHAR(20),
  reorder_level DECIMAL(10,2),
  reorder_qty DECIMAL(10,2),
  unit_cost DECIMAL(10,2),
  asset_flag BOOLEAN
);
```

**Items**:

| Item ID | Item Name | Unit | Reorder Level | Reorder Qty | Unit Cost | Asset |
|---------|-----------|------|---------------|-------------|-----------|-------|
| OXY_LITER | Oxygen (liters) | liters | 5,000 | 10,000 | ₹0.75 | No |
| VENT_UNIT | Ventilator Unit | unit | 1 | 1 | ₹250,000 | Yes |

**Asset Flag**: Distinguishes between consumables (0) and capital assets (1)

---

### Data Relationships
```
hospitals (1) ──→ (many) hospital_resource_timeseries
hospitals (1) ──→ (many) hospital_finance_monthly

suppliers (many) ──→ (many) inventory_items (implicit relationship)
```

**Foreign Key Constraints**:
- `hospital_resource_timeseries.hospital_id` → `hospitals.hospital_id`
- Ensures referential integrity across tables

---

### Data Statistics Summary

| Metric | Value |
|--------|-------|
| Total Hospitals | 50 |
| Total Bed Capacity | ~9,000 beds (varies) |
| Geographic Coverage | Pune Metropolitan Area |
| Resource Data Points | 25 metrics per hospital |
| Financial Data Points | 16 metrics per hospital per month |
| Vendors | 3 major suppliers |
| Inventory Items | 2 critical items tracked |
| Data Timestamp | 2025-10-28 08:45:04 |

---

### Data Realism Features

#### Statistical Distributions
- **Normal distributions** for occupancy rates (with realistic means and standard deviations)
- **Clipped ranges** to prevent impossible values (e.g., no negative beds)
- **Correlations**: Larger hospitals have more ICU beds, staff, and higher costs

#### Geographic Accuracy
- Coordinates within actual Pune boundaries
- Normal distribution around city center (±0.03° standard deviation)
- Realistic hospital name conventions

#### Operational Realism
- Not all resources at 100% capacity (realistic underutilization)
- Government hospitals tend to be larger (aligned with policy)
- Financial ratios match healthcare industry norms
- Staff shortages reflected (required > on_shift)

#### Time-Series Ready
- Timestamp field supports historical data collection
- Structure allows for multiple snapshots over time
- Can be extended for trend analysis

---

### Usage in the System

The SQL agent uses this data to answer queries like:

- **Capacity Planning**: "Which hospitals have available ICU beds?"
- **Resource Allocation**: "Show hospitals with low oxygen supplies"
- **Financial Analysis**: "What are the highest cost hospitals?"
- **Geographic Queries**: "List hospitals near Kothrud"
- **Operational Metrics**: "Which hospitals have the longest ED wait times?"
- **Supply Chain**: "What is the lead time for oxygen suppliers?"



## Agent Architecture and Design Choices

### System Overview

This agent employs a **hierarchical multi-agent architecture** built on Google's Agent Development Kit (ADK) framework. The system decomposes the complex task of natural language to SQL conversion into specialized sub-tasks, each handled by dedicated agents or tools.

**Architecture Pattern**: Orchestrator-Worker Model with Specialized Sub-Agents
```
┌─────────────────────────────────────────────────────────────┐
│                     Root Agent (SQL Agent)                   │
│                   [Gemini 2.5 Flash Model]                   │
│                                                               │
│  - Orchestrates entire workflow                              │
│  - Manages conversation state                                │
│  - Generates SQL queries                                     │
│  - Produces natural language responses                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬─────────────────┐
             │              │              │                 │
             ▼              ▼              ▼                 ▼
    ┌────────────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────────┐
    │ get_schema     │ │ run_sql   │ │ rewrite      │ │ evaluate     │
    │ _tool          │ │ _query    │ │ _prompt      │ │ _result      │
    │                │ │ _tool     │ │ _agent       │ │ _agent       │
    │ [Function]     │ │[Function] │ │ [Sub-Agent]  │ │ [Sub-Agent]  │
    └────────────────┘ └───────────┘ └──────────────┘ └──────────────┘
         │                   │              │                 │
         ▼                   ▼              ▼                 ▼
    MySQL Schema      Query Execution   Query Refinement  Result
    Retrieval         (via LangChain)   (Gemini 2.5)      Validation
                                                           (Gemini 2.5)
```

---

### Core Components

### 1. Root Agent (SQL Agent)

**File**: `sql_agent/agent.py`

**Role**: Central orchestrator that coordinates all sub-agents and tools to process user queries end-to-end.

**Configuration**:
```python
root_agent = Agent(
    name="sql_agent",
    model="gemini-2.5-flash",
    description="Process natural language questions about the database",
    instruction=instruction_prompt,
    tools=[get_schema_tool, run_sql_query_tool, 
           AgentTool(rewrite_prompt_agent), 
           AgentTool(evaluate_result_agent)]
)
```

**Responsibilities**:

1. **Workflow Orchestration**
   - Determines which tools/agents to call and in what order
   - Manages the complete query processing pipeline
   - Handles error recovery and retries

2. **SQL Generation**
   - Analyzes the database schema
   - Interprets refined user queries
   - Constructs syntactically correct SQL statements
   - Optimizes queries for performance

3. **Response Formulation**
   - Translates raw query results into natural language
   - Removes technical jargon
   - Provides context and insights
   - Maintains conversational tone

4. **State Management**
   - Tracks conversation history
   - Maintains context across multi-turn dialogues
   - Stores intermediate results for reference

**Instruction Prompt Strategy**:
The root agent receives a comprehensive instruction set that:
- Defines its role and responsibilities
- Specifies the exact workflow sequence
- Documents all available tools with input/output schemas
- Enforces rules (e.g., "only one call to get_schema_tool per execution")
- Mandates natural language output format

**Example Workflow**:
```
User: "Which hospitals have available ICU beds?"
  ↓
Root Agent:
  1. Calls get_schema_tool() → Receives table structures
  2. Calls rewrite_prompt_agent → Gets clarified query
  3. Generates SQL: SELECT hospital_name, (total_icu_beds - icu_occupied_beds) as available...
  4. Calls run_sql_query_tool(query) → Receives results
  5. Calls evaluate_result_agent → Validates correctness
  6. Formulates response: "15 hospitals currently have available ICU beds..."
```

---

### 2. Rewrite Prompt Agent

**File**: `sql_agent/subagents/rewrite_prompt.py`

**Role**: Transforms ambiguous or colloquial user queries into clear, structured prompts optimized for SQL generation.

**Configuration**:
```python
rewrite_prompt_agent = Agent(
    name="rewrite_prompt_agent",
    model="gemini-2.5-flash",
    description="Rewrites user input into simplified, unambiguous prompt",
    instruction=instruction_prompt,
    input_schema=RewritePromptInput
)
```

**Input Schema**:
```python
class RewritePromptInput(BaseModel):
    user_input: str      # Original natural language query
    db_schema: str       # Complete database schema for context
```

**Purpose & Benefits**:

1. **Ambiguity Resolution**
   - Converts vague terms into specific database concepts
   - Example: "best selling" → "highest total sales based on invoice data"

2. **Schema Alignment**
   - Maps colloquial terms to actual column names
   - Example: "busy hospitals" → "hospitals with high bed occupancy rates"

3. **SQL-Friendly Structure**
   - Rephrases queries in a format conducive to SQL generation
   - Removes unnecessary words and slang
   - Clarifies aggregation requirements (sum, average, count, etc.)

**Transformation Examples**:

| Original User Input | Database Schema Context | Rewritten Prompt |
|---------------------|-------------------------|------------------|
| "Show me busy hospitals" | hospitals, hospital_resource_timeseries | "List hospitals with bed occupancy rates above 80%" |
| "Which places are running out of oxygen?" | hospital_resource_timeseries (available_oxygen_liters) | "Show hospitals where available oxygen is below 5000 liters" |
| "Top expensive hospitals to run" | hospital_finance_monthly (total_expenditure) | "List hospitals with the highest total monthly expenditure" |
| "Where do we need more doctors?" | hospital_resource_timeseries (required_doctors, on_shift_doctors) | "Show hospitals where required doctors exceed on-shift doctors" |

**Design Rationale**:
- **Why a separate agent?** Query rewriting requires understanding both natural language nuances AND database schema. Separating this logic allows the root agent to focus on SQL generation.
- **Why Gemini 2.5 Flash?** Fast inference for quick preprocessing without sacrificing quality.
- **Schema as input?** Provides context for accurate column/table name mapping.

---

### 3. Evaluate Result Agent

**File**: `sql_agent/subagents/evaluate_results.py`

**Role**: Quality assurance agent that validates whether SQL query results correctly answer the user's original intent.

**Configuration**:
```python
evaluate_result_agent = Agent(
    name="evaluate_result",
    model="gemini-2.5-flash",
    description="Evaluate SQL query result for correctness",
    instruction=instruction_prompt,
    input_schema=EvaluateResultInput
)
```

**Input Schema**:
```python
class EvaluateResultInput(BaseModel):
    user_input: str      # Original user question
    sql_query: str       # Generated SQL query
    result: str          # Query execution results
    db_schema: str       # Database schema for context
```

**Output**: Returns either `"Correct"` or `"Partial"`

**Evaluation Criteria**:

1. **Intent Matching**
   - Does the result answer what the user actually asked?
   - Example: User asks for "available beds" but query returns "total beds" → Partial

2. **Completeness**
   - Are all required data points present?
   - Example: User asks for "top 5 hospitals" but only 3 returned → Partial

3. **Accuracy**
   - Are the calculations correct?
   - Do aggregations (SUM, AVG, COUNT) align with the question?

4. **Relevance**
   - Is extraneous data excluded?
   - Are filters applied correctly?

**Example Evaluation**:
```
User Input: "Which hospitals have more than 100 available beds?"
SQL Query: SELECT hospital_name, (total_beds - occupied_beds) AS available 
           FROM hospitals h JOIN hospital_resource_timeseries t ...
           WHERE (total_beds - occupied_beds) > 100
Result: [("Ruby Hill Hospital", 145), ("Sahyadri General", 120)]

Evaluation: "Correct" ✓
Reasoning: Query correctly calculates available beds and applies the filter.
```
```
User Input: "Show me hospitals with low oxygen"
SQL Query: SELECT hospital_name, total_beds FROM hospitals
Result: [("Ruby Hill Hospital", 145), ...]

Evaluation: "Partial" ✗
Reasoning: Query returns total_beds instead of oxygen levels. Wrong column.
```

**Design Rationale**:
- **Why validate results?** Automated SQL generation can produce syntactically correct but semantically wrong queries. This agent catches those errors.
- **Why binary output?** Simple "Correct" vs "Partial" classification allows root agent to decide whether to retry or return results.
- **Future enhancement**: Could provide specific feedback for query refinement (e.g., "Wrong column used: total_beds instead of available_oxygen_liters").

---

### 4. Function Tools

**File**: `sql_agent/tools.py`

Function tools provide direct interactions with external systems (database) without requiring LLM inference.

#### 4.1 get_schema_tool

**Purpose**: Retrieves database schema information to inform SQL query generation.

**Implementation**:
```python
def get_schema(input: Optional[dict] = None) -> dict:
    if isinstance(input, dict) and input.get("table"):
        schema = db.get_table_info([input["table"]])  # Specific table
    else:
        schema = db.get_table_info()  # Full schema
    return {"schema_description": schema}

get_schema_tool = FunctionTool(get_schema)
```

**Capabilities**:
- **Full schema retrieval**: Returns all tables, columns, types, constraints
- **Targeted retrieval**: Can fetch schema for specific table if needed
- **Error handling**: Returns error messages if database connection fails

**Output Format** (example):
```
CREATE TABLE hospitals (
  hospital_id VARCHAR(50) PRIMARY KEY,
  hospital_name VARCHAR(100),
  region VARCHAR(50),
  latitude DECIMAL(9,6),
  ...
);

CREATE TABLE hospital_resource_timeseries (
  timestamp DATETIME,
  hospital_id VARCHAR(50),
  occupied_beds INT,
  ...
  FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id)
);
...
```

**Design Rationale**:
- **Why retrieve schema dynamically?** Database schemas can change. Dynamic retrieval ensures queries always match current structure.
- **Why use LangChain's SQLDatabase?** Provides standardized schema formatting across different database types (MySQL, PostgreSQL, SQLite).
- **Performance consideration**: Schema retrieval is fast (cached by LangChain) and only called once per query.

#### 4.2 run_sql_query_tool

**Purpose**: Executes generated SQL queries against the MySQL database and returns results.

**Implementation**:
```python
def run_sql_query(input: Optional[dict] = None) -> dict:
    sql_query = input.get("query")
    if not sql_query:
        return {"error": "No query provided in the 'query' key."}
    try:
        result = db.run(sql_query)
        return {"raw_result": result}
    except Exception as e:
        logger.error(f"Error in run_sql_query: {e}")
        return {"error": str(e)}

run_sql_query_tool = FunctionTool(run_sql_query)
```

**Features**:
- **Direct SQL execution**: No LLM overhead, just database query
- **Error propagation**: Returns detailed error messages for debugging
- **Result formatting**: Returns raw results as strings for agent processing
- **Logging**: All queries logged for audit trail

**Security Considerations**:
- **Read-only access**: Connection should be configured with SELECT-only privileges
- **Query validation**: Root agent is instructed not to generate destructive queries (DROP, DELETE, UPDATE)
- **Error handling**: SQL injection risks mitigated by agent's trained behavior (generates safe queries)

**Design Rationale**:
- **Why not let LLM execute queries?** Database operations should be deterministic. Function tools provide reliable, fast execution without hallucination risk.
- **Why return raw results?** Allows root agent flexibility in formatting responses. Can do additional processing if needed.

---

### Database Connection

**File**: `sql_agent/tools.py`

**Technology Stack**:
```python
from langchain_community.utilities import SQLDatabase

connection_uri = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
db = SQLDatabase.from_uri(connection_uri)
```

**Connection Details**:
- **Driver**: `mysql-connector-python` via SQLAlchemy
- **Connection pooling**: Managed by SQLAlchemy
- **Configuration source**: Environment variables from `.env` file
- **Fallback**: Graceful degradation to DummyDB if connection fails

**Environment Variables**:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospital_data
```

---

### Design Choices & Rationale

### Why Multi-Agent Architecture?

#### 1. **Separation of Concerns**
Each agent/tool has a single, well-defined responsibility:
- **Root Agent**: Orchestration and SQL generation
- **Rewrite Agent**: Query clarification
- **Evaluate Agent**: Result validation
- **Schema Tool**: Database introspection
- **Query Tool**: SQL execution

**Benefit**: Easier to debug, test, and maintain. If query validation fails, we know exactly which component to fix.

#### 2. **Modularity & Reusability**
Sub-agents can be used independently:
- **Rewrite Agent** could be used in other NLP pipelines
- **Evaluate Agent** could validate results from any SQL generator
- Tools can be swapped (e.g., replace MySQL with PostgreSQL without changing agents)

**Benefit**: Components are composable. Future extensions (e.g., adding a "query optimization agent") integrate seamlessly.

#### 3. **Cognitive Load Reduction**
Instead of one massive prompt trying to do everything, each agent focuses on a specific sub-task:
- Rewrite Agent doesn't worry about SQL syntax
- Root Agent doesn't worry about ambiguity resolution
- Evaluate Agent only assesses correctness, not generation

**Benefit**: Better performance. Specialized agents excel at their specific tasks.

#### 4. **Error Isolation & Recovery**
If one component fails, others continue working:
- Schema retrieval fails → Can still attempt query with partial knowledge
- Query execution fails → Evaluate agent provides diagnostic feedback
- Validation returns "Partial" → Root agent can retry with refined query

**Benefit**: Graceful degradation. System doesn't completely fail on single-point errors.

---


### Workflow Execution Example

**Complete flow for query**: *"Which hospitals have less than 3000 liters of oxygen?"*
```
1. User sends message via React UI
   POST /chat {user_query: "Which hospitals have less than 3000 liters of oxygen?", ...}
   
2. FastAPI receives request
   - Validates request (Pydantic)
   - Ensures session exists (SQLite)
   - Creates Content object for ADK
   
3. Root Agent receives query
   - Recognizes need for database query
   - Decides to call tools/agents
   
4. Root Agent → get_schema_tool
   Input: {}
   Output: {schema_description: "CREATE TABLE hospitals ... CREATE TABLE hospital_resource_timeseries ..."}
   
5. Root Agent → rewrite_prompt_agent
   Input: {
     user_input: "Which hospitals have less than 3000 liters of oxygen?",
     db_schema: "CREATE TABLE ... hospital_resource_timeseries (available_oxygen_liters FLOAT, ...)"
   }
   Output: "List hospitals where available_oxygen_liters < 3000"
   
6. Root Agent generates SQL
   (Internal reasoning, no tool call)
   Generated query:
   SELECT h.hospital_name, hrt.available_oxygen_liters
   FROM hospitals h
   JOIN hospital_resource_timeseries hrt ON h.hospital_id = hrt.hospital_id
   WHERE hrt.available_oxygen_liters < 3000
   ORDER BY hrt.available_oxygen_liters ASC;
   
7. Root Agent → run_sql_query_tool
   Input: {query: "SELECT h.hospital_name ..."}
   Output: {raw_result: "[('Pune NMC Hospital', 2768.3), ('Narhe Hospital', 2370.0), ...]"}
   
8. Root Agent → evaluate_result_agent
   Input: {
     user_input: "Which hospitals have less than 3000 liters of oxygen?",
     sql_query: "SELECT h.hospital_name ...",
     result: "[('Pune NMC Hospital', 2768.3), ...]",
     db_schema: "..."
   }
   Output: "Correct"
   
9. Root Agent formulates response
   (Internal reasoning)
   Response: "Currently, 2 hospitals have oxygen levels below 3000 liters: Pune NMC Hospital with 2,768 liters and Narhe Hospital with 2,370 liters. These hospitals may need urgent oxygen resupply."
   
10. FastAPI returns response to React UI
    {response: "Currently, 2 hospitals have oxygen levels below 3000 liters..."}
    
11. React displays message in chat interface
    User sees natural language answer
```

**Total time**: ~3-5 seconds (including network latency)

---

### Error Handling Strategy

#### 1. Session Recovery
```python
async def ensure_session_with_retries(app_name, user_id, session_id, max_retries=5):
    for attempt in range(max_retries):
        try:
            return await session_service.create_session(...)
        except Exception:
            await asyncio.sleep(base_delay * (2 ** attempt))  # Exponential backoff
```

**Handles**: Database locks, concurrent session creation, network blips

#### 2. Agent Execution Recovery
```python
async def run_agent_with_session_recovery(runner, user_id, session_id, message, max_attempts=3):
    for attempt in range(max_attempts):
        try:
            return await runner.run_async(...)
        except ValueError as ve:
            if "Session not found" in str(ve):
                await recreate_session(...)  # Recreate and retry
```

**Handles**: Lost sessions, stale connections, agent timeouts

#### 3. Database Connection Fallback
```python
try:
    db = SQLDatabase.from_uri(connection_uri)
except Exception as e:
    logger.error(f"Failed to connect: {e}")
    db = DummyDB()  # Returns error messages instead of crashing
```

**Handles**: MySQL server down, wrong credentials, network issues

#### 4. Tool-Level Error Handling
```python
def run_sql_query(input):
    try:
        result = db.run(sql_query)
        return {"raw_result": result}
    except Exception as e:
        return {"error": str(e)}  # Agent can read error and inform user
```

**Handles**: SQL syntax errors, missing tables, permission issues

---



## Logic Behind Adaptive Learning and Reasoning

### Overview
The Froncort SQL agent implements an intelligent multi-layered reasoning system that goes beyond simple query translation. The system maintains conversational context across sessions, validates its own outputs, and continuously refines its understanding to provide increasingly accurate responses through robust session management and multi-agent collaboration.

---

### Core Reasoning Mechanisms

#### 1. **Conversational Context Retention & Session Management**

The system maintains persistent session state across multi-turn conversations using **SQLite** for local storage, enabling contextual reasoning and conversation continuity.

**Storage Architecture**:
- **SQLite Database** (`my_chatbot_data.db`) stores session state and conversation history
- Managed by Google ADK's `DatabaseSessionService`

```

**Session Lifecycle Management**:

**1. Session Creation with Retry Logic**

The system implements robust session creation with exponential backoff retry mechanism (up to 5 attempts):
```python
async def ensure_session_with_retries(app_name, user_id, session_id, max_retries=5):
    # Checks if session exists in SQLite
    # If not, creates new session with empty state
    # Implements exponential backoff: 0.1s, 0.2s, 0.4s, 0.8s, 1.6s delays
    # Verifies session creation by re-reading from database
    # Handles race conditions and database locks gracefully
```

**Key Features**:
- **Existence Check**: First attempts to retrieve existing session from SQLite
- **Automatic Creation**: Creates new session if not found
- **Exponential Backoff**: Progressive delays between retry attempts prevent database contention
- **Verification Step**: Re-reads session from database to confirm successful creation
- **Race Condition Handling**: Detects and handles concurrent session creation attempts
- **Graceful Degradation**: Returns existing session if found during retry loop

**Retry Timeline**:
```
Attempt 1: Create session → Verify → Wait 0.1s
Attempt 2: Create session → Verify → Wait 0.2s
Attempt 3: Create session → Verify → Wait 0.4s
Attempt 4: Create session → Verify → Wait 0.8s
Attempt 5: Create session → Verify → Wait 1.6s (final attempt)
```

**2. Session Recovery During Agent Execution**

Automatic session recovery if lost during query processing:
```python
async def run_agent_with_session_recovery(runner, user_id, session_id, message, max_attempts=3):
    # Monitors for "Session not found" errors during agent execution
    # Automatically recreates lost sessions mid-conversation
    # Retries agent execution with recovered session
    # Preserves conversation continuity despite failures
```

**Key Features**:
- **Error Detection**: Monitors for `ValueError: "Session not found"` during agent execution
- **Transparent Recreation**: Automatically recreates lost sessions without user intervention
- **Execution Retry**: Resumes agent workflow with recovered session
- **User Experience**: Maintains conversation flow despite backend failures
- **Progressive Delays**: Implements 0.2s, 0.4s, 0.6s delays between recovery attempts

**3. Message Extraction & History Reconstruction**

Flexible message parsing from various state formats:
```python
def _extract_messages_from_state(state):
    # Parses conversation history from SQLite state JSON
    # Supports multiple message formats (ADK native, custom)
    # Extracts sender (user/bot) and text content
    # Reconstructs chronological conversation flow
```

**Key Features**:
- **Format Flexibility**: Handles both ADK native format and custom message structures
- **Robust Parsing**: Gracefully handles missing or malformed data
- **Role Mapping**: Converts various role identifiers to standardized sender format
- **Content Extraction**: Retrieves text from nested parts structures

**Session Endpoints**:

- **`POST /sessions/ensure`**: Proactively creates/verifies session before conversation starts
  - Input: `{user_id: str, session_id: str}`
  - Output: `{status: "ok", session_exists: true, session_id: str}`
  
- **`GET /history/{user_id}/{session_id}`**: Retrieves full conversation history from SQLite
  - Returns: `{messages: [{sender: str, text: str}, ...]}`
  
- **`POST /chat`**: Main endpoint that ensures session exists before processing queries
  - Input: `{user_query: str, user_id: str, session_id: str}`
  - Output: `{response: str}`

---

2. **Session Recovery During Agent Execution**
   ```python
   # Automatic session recovery if lost during query processing
   async def run_agent_with_session_recovery(runner, user_id, session_id, message, max_attempts=3):
       - Monitors for "Session not found" errors during agent execution
       - Automatically recreates lost sessions mid-conversation
       - Retries agent execution with recovered session
       - Preserves conversation continuity despite failures
   ```

3. **Message Extraction & History Reconstruction**
   ```python
   # Flexible message parsing from various state formats
   def _extract_messages_from_state(state):
       - Parses conversation history from SQLite state JSON
       - Supports multiple message formats (ADK native, custom)
       - Extracts sender (user/bot) and text content
       - Reconstructs chronological conversation flow
   ```

**Session Endpoints**:

- **POST `/sessions/ensure`**: Proactively creates/verifies session before conversation starts
- **GET `/history/{user_id}/{session_id}`**: Retrieves full conversation history from SQLite
- **POST `/chat`**: Main endpoint that ensures session exists before processing queries

**Contextual Reasoning Examples**:

**Follow-up Questions Without Context Loss**:
```
Session: session_1762617672349
User: "Which hospitals have available ICU beds?"
Agent: [Session stored in SQLite with query results]
       "15 hospitals have ICU beds available..."

User: "What about their oxygen levels?"
Agent: [Retrieves session from SQLite]
       [Reads last_sql_result_json to identify the 15 hospitals]
       [Understands "their" refers to hospitals from previous query]
       "Among those 15 hospitals, oxygen levels range from..."
```

**Cross-Session Persistence**:
```
Session 1 (Morning):
User: "Show me hospitals near Kothrud"
Agent: "3 hospitals found: Ruby Hill, Sahyadri, Kothrud District Hospital..."
[Session saved to SQLite: session_278946.812]

Session 2 (Afternoon - Same User):
User: "What were those Kothrud hospitals again?"
Agent: [Loads previous session from SQLite via user_id]
       [Retrieves cached results from state]
       "You previously asked about Kothrud hospitals: Ruby Hill, Sahyadri, Kothrud District Hospital"
```

**Implicit Reference Resolution**:
```
User: "Show me hospitals near Kothrud"
Agent: "3 hospitals found near Kothrud: Ruby Hill, Sahyadri..."
[Stores hospital_ids in session state]

User: "Which one has the lowest wait times?"
Agent: [Accesses session state from SQLite]
       [Knows "which one" = subset of hospital_ids from previous result]
       [Queries only those 3 hospitals' ED turnaround times]
       "Ruby Hill Hospital has the shortest wait time at 18 minutes..."
```


**Session Recovery Flow Example**:
```
User sends message → POST /chat endpoint
  ↓
ensure_session_with_retries()
  ├→ Try: get_session() → Session exists ✓
  │   └→ Return existing session
  │
  └→ Catch: Session not found
      └→ Retry loop (5 attempts):
          ├→ Attempt 1: create_session() → Verify → Success ✓
          ├→ Attempt 2: create_session() → Verify → Failed
          │   └→ Wait 0.2s → Retry
          └→ Attempt 5: Exhausted → Raise error
  ↓
run_agent_with_session_recovery()
  ├→ Attempt 1: runner.run_async() → ValueError: Session not found
  │   └→ Recreate session → Retry
  ├→ Attempt 2: runner.run_async() → Success ✓
  └→ Return final_response
```

---



### Complete Reasoning Workflow

```
┌──────────────────────────────────────┐
│   User Query Received via POST /chat │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ ensure_session_with_retries()        │ ← Check/Create SQLite session
│  - Check if session exists            │
│  - Create new session if needed       │
│  - Retry with exponential backoff     │
│  - Verify session creation            │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ run_agent_with_session_recovery()    │ ← Execute agent with recovery
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Root Agent Receives Query            │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Load Conversation Context            │ ← Read from SQLite session.state
│  - Previous messages                  │
│  - Last query results                 │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Retrieve Database Schema             │ ← get_schema_tool()
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Rewrite Query for Clarity            │ ← rewrite_prompt_agent
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Generate SQL Query                   │ ← Root agent reasoning
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Execute Query Against MySQL          │ ← run_sql_query_tool()
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Validate Results                     │ ← evaluate_result_agent
└────────────┬─────────────────────────┘
             │
             ├───── If "Partial"
             │      └──────────────────────── (Could retry)
             │
             ▼ If "Correct"
┌──────────────────────────────────────┐
│ Format Natural Language Response     │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Update Session State in SQLite       │ ← Save conversation + results
│  - Append new messages                │
│  - Store query results                │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Return Response to User              │
└──────────────────────────────────────┘
```
## 🚧 Limitations and Future Extensions

### ⚠️ Current Limitations

#### 1. Database Hosting & Deployment
The MySQL database currently runs on `localhost`, limiting access to the local development environment.  
For production deployment, the database should be hosted on cloud platforms like **AWS RDS**, **Google Cloud SQL**, or **Azure Database for MySQL** to enable:
- Remote access  
- Automated backups  
- High availability with multi-region replication  
- Geographic distribution for reduced latency  

Without this, the system cannot scale to multiple users and risks a single point of failure with no automated disaster recovery.

---

#### 2. Static Data Without Real-Time Updates
The hospital resource data is static, representing a snapshot (`2025-10-28 08:45:04`) rather than real-time data.  
In production, integration with **Hospital Management Systems (HMS)** and **Electronic Health Record (EHR)** systems via **APIs** or **webhooks** is required for live updates on:
- Bed availability  
- Oxygen levels  
- Staff counts  
- Patient admissions  

A real-time system would leverage **WebSockets**, **polling mechanisms** for instant synchronization.

---

#### 3. Absence of Event Streaming Architecture
Currently, the system processes queries synchronously.  
A production-grade system should adopt an **event-driven architecture** using **Apache Kafka** for:
- Asynchronous data processing  
- Fault tolerance and event replay  
- Horizontal scalability  
- Real-time analytics and alerting  

Without Kafka, the system cannot efficiently manage concurrent requests or integrate data from multiple hospitals simultaneously.

---

#### 4. Google Vertex AI Not Utilized
While the project currently uses the **Gemini API**, migrating to **Google Vertex AI** would enable:
- Custom model fine-tuning on hospital-specific data  
- **Context optimization** — Vertex AI ensures that only **relevant details** from previous interactions or schema context are stored and used during query generation, improving response accuracy and minimizing unnecessary memory usage  

---

#### 7. Query Performance Optimization
The system currently executes SQL queries without optimization.  
Production performance improvements include:
- **Redis caching** for frequently used queries   
- **Index creation** on frequently queried columns  

These would significantly improve throughput and responsiveness.

---



#### 10. Single Language Support
The system currently supports only **English**, limiting accessibility.  
Integrating **Google Cloud Translation API** would:
- Detect and translate Marathi/Hindi input queries  
- Translate system responses back to the user’s language  
- Ensure accuracy with fine-tuned medical term translations  

This would significantly enhance usability across Indian healthcare facilities.

---

### 🚀 Potential Future Extensions

Each proposed extension addresses one or more limitations identified above and can be incrementally integrated.

#### 1. Cloud Database Migration with High Availability
Migrate to **AWS RDS**, **Google Cloud SQL**, or **Azure Database for MySQL** with:
- Automated failover and backups  
- IAM-based authentication  
- Read replicas for global scalability  
- Connection pooling via **RDS Proxy** or **Cloud SQL Proxy**

---

#### 2. Real-Time Data Integration via WebSockets
Enable **live hospital updates** using:
- **WebSocket endpoints** (`/ws/hospital/{hospital_id}`)  
- **Triggers** for critical alerts (e.g., low oxygen thresholds)

---

#### 3. Apache Kafka Event Streaming Infrastructure
Deploy a **Kafka cluster** for asynchronous, scalable communication:
- Topics for hospital updates, admissions, and queries  
- **Kafka Streams** for real-time aggregation  
- **Event replay** for fault recovery  
- **FastAPI integration** via `aiokafka`

---

#### 4. Google Vertex AI Enterprise Integration
Leverage **Vertex AI** for:
- Custom model fine-tuning  
- Automated MLOps pipelines  
- Feature Store for query embeddings and user preferences  
- Model monitoring and explainability tools  

---


