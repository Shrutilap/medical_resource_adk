from google.cloud.aiplatform import vertexai

vertexai.init(project="froncort", location="us-central1")

remote_agent = vertexai.preview.generative_models.AgentEngine.create(
    config={
        "display_name": "SQL Agent",
        "description": "Agent that processes natural language into SQL and evaluates results.",
        "source_packages": ["sql_agent"],
        "entrypoint_module": "sql_agent.agent",
        "entrypoint_object": "root_agent",
        "requirements_file": "requirements.txt",
        "class_methods": [
            {
                "name": "run",
                "api_mode": "",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_query": {
                            "type": "string",
                            "description": "User's question in natural language"
                        }
                    },
                    "required": ["user_query"]
                },
            }
        ],
    },
)

print("✅ Agent deployed successfully!")
print("Resource name:", remote_agent.api_resource.name)
