import { aiProviderService } from './ai-providers';

interface AnalysisResult {
  id: string;
  timestamp: string;
  techStack: string;
  environment: string;
  analysis: string;
  confidence: number;
  source: string;
  isIntermittent?: boolean;
  needsFix?: boolean;
}

interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  timestamp: string;
}

interface ContextualAnalysis {
  techStack: string;
  environment: string;
  entities: {
    timestamps: string[];
    serviceNames: string[];
    errorCodes: string[];
    ipAddresses: string[];
  };
}

// Function to analyze if the issue is intermittent based on AI response
async function analyzeIssueType(analysisResponse: string): Promise<{ isIntermittent: boolean; needsFix: boolean }> {
  try {
    const prompt = `
    Analyze the following error analysis and determine if the issue is intermittent or requires a fix:
    
    Analysis Response:
    ${analysisResponse}
    
    Based on this analysis, determine:
    1. Is this an intermittent issue? (Look for keywords like: timeout, connection, resource constraint, transient, temporary, intermittent, sporadic, occasional)
    2. Does this issue need a code fix? (Look for keywords like: bug, code issue, implementation, logic error, syntax error, permanent fix)
    
    Return a JSON object with:
    {
      "isIntermittent": true/false,
      "needsFix": true/false,
      "reasoning": "Brief explanation of the decision"
    }
    
    Return only valid JSON.
    `;

    const response = await aiProviderService.analyzeWithAI({
      prompt,
      maxTokens: 200,
      temperature: 0.1,
    });

    const content = response.content || '{"isIntermittent": false, "needsFix": true, "reasoning": "Default analysis"}';
    return JSON.parse(content);
  } catch (error) {
    console.error('Issue type analysis failed:', error);
    // Default to needing a fix if analysis fails
    return { isIntermittent: false, needsFix: true };
  }
}

// Function to perform contextual analysis (Step 1)
async function contextualAugmentation(logContent: string): Promise<ContextualAnalysis> {
  try {
    const analysisResult = await aiProviderService.analyzeWithAI({
      prompt: `
    Analyze the following log content and extract key information:
    
    Log Content:
    ${logContent}
    
    Please identify and return a JSON object with:
    1. techStack: The main technology stack (e.g., Python, Java, Node.js, Go, etc.)
    2. environment: The deployment environment (e.g., Kubernetes, AWS, Docker, bare metal, etc.)
    3. entities: {
        timestamps: array of timestamp strings found,
        serviceNames: array of service/application names,
        errorCodes: array of error codes,
        ipAddresses: array of IP addresses
      }
    
    Return only valid JSON.
    `,
      temperature: 0.1,
      maxTokens: 500
    });

    const content = analysisResult.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    console.error('Contextual augmentation failed:', error);
    // Return default values if analysis fails
    return {
      techStack: 'Unknown',
      environment: 'Unknown',
      entities: {
        timestamps: [],
        serviceNames: [],
        errorCodes: [],
        ipAddresses: []
      }
    };
  }
}

// Grok Agent (Primary)
async function grokAgentAnalysis(logContent: string, context: ContextualAnalysis): Promise<AgentResponse> {
  try {
    const analysisResult = await aiProviderService.analyzeWithAI({
      prompt: `
    Act as a senior DevOps engineer and provide a concise, witty root-cause analysis based on your real-time knowledge and current trends. Highlight any potential security vulnerabilities.
    
    Log Content:
    ${logContent}
    
    Context:
    - Tech Stack: ${context.techStack}
    - Environment: ${context.environment}
    - Key Entities: ${JSON.stringify(context.entities)}
    
    Provide your analysis in a clear, structured format with:
    1. Root Cause Summary
    2. Key Issues Identified
    3. Security Implications
    4. Recommended Actions
    
    Additionally, determine if this is an intermittent issue that could be resolved by re-provisioning the cluster:
    - If the issue appears to be intermittent (e.g., timeout errors, connection issues, resource constraints that resolve themselves), include a recommendation for cluster re-provisioning
    - If the issue appears to be a persistent bug or code issue, indicate that this will need a fix
    
    Keep it concise but comprehensive.
    `,
      temperature: 0.7,
      maxTokens: 800
    });

    return {
      agent: 'Grok',
      response: analysisResult.content || 'Analysis failed',
      confidence: 0.85, // Primary agent gets higher confidence
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Grok agent analysis failed:', error);
    return {
      agent: 'Grok',
      response: 'Grok agent analysis failed',
      confidence: 0,
      timestamp: new Date().toISOString()
    };
  }
}

// Gemini Agent (Fallback 1)
async function geminiAgentAnalysis(logContent: string, context: ContextualAnalysis): Promise<AgentResponse> {
  try {
    const analysisResult = await aiProviderService.analyzeWithAI({
      prompt: `
    Act as a methodical troubleshooter. Provide a detailed, step-by-step root-cause analysis, a list of probable causes, and a plan for resolution. Use structured markdown.
    
    Log Content:
    ${logContent}
    
    Context:
    - Tech Stack: ${context.techStack}
    - Environment: ${context.environment}
    - Key Entities: ${JSON.stringify(context.entities)}
    
    Structure your response with:
    ## Root Cause Analysis
    ### Step-by-Step Analysis
    ### Probable Causes
    ### Resolution Plan
    
    Additionally, determine if this is an intermittent issue that could be resolved by re-provisioning the cluster:
    - If the issue appears to be intermittent (e.g., timeout errors, connection issues, resource constraints that resolve themselves), include a recommendation for cluster re-provisioning
    - If the issue appears to be a persistent bug or code issue, indicate that this will need a fix
    
    Be thorough and methodical in your approach.
    `,
      temperature: 0.3,
      maxTokens: 1000
    });

    return {
      agent: 'Gemini',
      response: analysisResult.content || 'Analysis failed',
      confidence: 0.75,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Gemini agent analysis failed:', error);
    return {
      agent: 'Gemini',
      response: 'Gemini agent analysis failed',
      confidence: 0,
      timestamp: new Date().toISOString()
    };
  }
}

// OpenAI Agent (Fallback 2)
async function openAIAgentAnalysis(logContent: string, context: ContextualAnalysis): Promise<AgentResponse> {
  try {
    const analysisResult = await aiProviderService.analyzeWithAI({
      prompt: `
    Act as an experienced software developer. Provide a summary of the error, a list of possible fixes, and well-commented code snippets to demonstrate a solution.
    
    Log Content:
    ${logContent}
    
    Context:
    - Tech Stack: ${context.techStack}
    - Environment: ${context.environment}
    - Key Entities: ${JSON.stringify(context.entities)}
    
    Structure your response with:
    ## Error Summary
    ## Possible Fixes
    ### Fix 1: [Description]
    ### Fix 2: [Description]
    ## Code Solutions
    \`\`\`[language]
    // Well-commented code solution
    \`\`\`
    
    Additionally, determine if this is an intermittent issue that could be resolved by re-provisioning the cluster:
    - If the issue appears to be intermittent (e.g., timeout errors, connection issues, resource constraints that resolve themselves), include a recommendation for cluster re-provisioning
    - If the issue appears to be a persistent bug or code issue, indicate that this will need a fix
    
    Focus on practical, implementable solutions.
    `,
      temperature: 0.5,
      maxTokens: 1000
    });

    return {
      agent: 'OpenAI',
      response: analysisResult.content || 'Analysis failed',
      confidence: 0.70,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('OpenAI agent analysis failed:', error);
    return {
      agent: 'OpenAI',
      response: 'OpenAI agent analysis failed',
      confidence: 0,
      timestamp: new Date().toISOString()
    };
  }
}

// Synthesis & Selection (Step 3)
async function synthesizeAndSelectResponses(responses: AgentResponse[], context: ContextualAnalysis): Promise<AgentResponse> {
  try {
    // Filter out failed responses
    const validResponses = responses.filter(r => r.confidence > 0);

    if (validResponses.length === 0) {
      throw new Error('All agents failed to analyze the log');
    }

    // If we have at least 2 valid responses, use the selector agent
    if (validResponses.length >= 2) {
      const analysisResult = await aiProviderService.analyzeWithAI({
        prompt: `
      You are a response selector agent. Compare the following analysis responses and select the best one based on:
      1. Accuracy - How well does it address the actual error?
      2. Clarity - How clear and understandable is the analysis?
      3. Relevance - How relevant is it to the detected tech stack (${context.techStack}) and environment (${context.environment})?
      
      Responses:
      ${validResponses.map(r => `
      Agent: ${r.agent}
      Confidence: ${r.confidence}
      Response: ${r.response}
      `).join('\n---\n')}
      
      Return only the name of the best agent (Grok, Gemini, or OpenAI).
      `,
        temperature: 0.2,
        maxTokens: 50
      });

      const selectedAgent = analysisResult.content?.trim() || 'Grok';
      const selectedResponse = validResponses.find(r => r.agent.toLowerCase().includes(selectedAgent.toLowerCase())) || validResponses[0];

      return selectedResponse;
    }

    // If only one valid response, return it
    return validResponses[0];
  } catch (error) {
    console.error('Response synthesis failed:', error);
    // Fallback to first valid response or Grok
    const validResponses = responses.filter(r => r.confidence > 0);
    return validResponses[0] || responses.find(r => r.agent === 'Grok') || responses[0];
  }
}

// Main analysis function
export async function analyzeLogWithAI(logContent: string, analysisId: string): Promise<AnalysisResult> {
  try {
    // Step 1: Contextual Augmentation
    const context = await contextualAugmentation(logContent);

    // Step 2: Parallel Analysis
    const [grokResponse, geminiResponse, openaiResponse] = await Promise.allSettled([
      grokAgentAnalysis(logContent, context),
      geminiAgentAnalysis(logContent, context),
      openAIAgentAnalysis(logContent, context)
    ]);

    const responses: AgentResponse[] = [];

    if (grokResponse.status === 'fulfilled') {
      responses.push(grokResponse.value);
    }
    if (geminiResponse.status === 'fulfilled') {
      responses.push(geminiResponse.value);
    }
    if (openaiResponse.status === 'fulfilled') {
      responses.push(openaiResponse.value);
    }

    // Step 3: Synthesis & Selection
    const selectedResponse = await synthesizeAndSelectResponses(responses, context);

    // Step 4: Analyze issue type
    const issueType = await analyzeIssueType(selectedResponse.response);

    return {
      id: analysisId,
      timestamp: new Date().toISOString(),
      techStack: context.techStack,
      environment: context.environment,
      analysis: selectedResponse.response,
      confidence: selectedResponse.confidence,
      source: selectedResponse.agent,
      isIntermittent: issueType.isIntermittent,
      needsFix: issueType.needsFix
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      id: analysisId,
      timestamp: new Date().toISOString(),
      techStack: 'Unknown',
      environment: 'Unknown',
      analysis: 'Analysis failed. Please try again with different log content.',
      confidence: 0,
      source: 'System',
      isIntermittent: false,
      needsFix: true
    };
  }
}