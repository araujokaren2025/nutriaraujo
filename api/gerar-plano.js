import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Configuração de CORS para permitir chamadas do frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { dados_do_paciente } = req.body;

  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY não configurada no servidor.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    const responseSchema = {
      type: "OBJECT",
      properties: {
        plano_semanal: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              dia: { type: "STRING" },
              refeicoes: {
                type: "OBJECT",
                properties: {
                  cafe_da_manha: { type: "ARRAY", items: { type: "STRING" } },
                  lanche_manha: { type: "ARRAY", items: { type: "STRING" } },
                  almoco: { type: "ARRAY", items: { type: "STRING" } },
                  lanche_tarde: { type: "ARRAY", items: { type: "STRING" } },
                  jantar: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar"]
              }
            },
            required: ["dia", "refeicoes"]
          }
        }
      },
      required: ["plano_semanal"]
    };

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${JSON.stringify(dados_do_paciente, null, 2)}

⚠️ Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Tenta fazer o parse para garantir que é um JSON válido
    const data = JSON.parse(text);
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro na geração do plano:', error);
    return res.status(500).json({ error: 'Erro ao gerar plano: ' + error.message });
  }
}
