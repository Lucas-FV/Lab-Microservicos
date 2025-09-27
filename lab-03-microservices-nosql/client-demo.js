const axios = require('axios');

class ShoppingListDemo {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.token = null;
        this.user = null;
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Helper to ask user input in terminal (returns a Promise)
    async ask(question) {
        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    }
    
    async testHealth() {
        console.log('=== Testando Health Check ===');
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            console.log('Health Check:', response.data);
            return true;
        } catch (error) {
            console.error('Health Check falhou:', error.message);
            return false;
        }
    }
    
    async testRegistry() {
        console.log('\n=== Testando Service Registry ===');
        try {
            const response = await axios.get(`${this.baseUrl}/registry`);
            console.log('Service Registry:', response.data);
            return true;
        } catch (error) {
            console.error('Service Registry falhou:', error.message);
            return false;
        }
    }
    
    async registerUser() {
        console.log('\n=== Registrando Novo Usuário ===');
        try {
            const userData = {
                email: `usuario${Math.floor(Math.random() * 1000)}@exemplo.com`,
                username: `user${Math.floor(Math.random() * 1000)}`,
                password: 'senha123',
                firstName: 'João',
                lastName: 'Silva',
                preferences: {
                    defaultStore: 'Mercado Central',
                    currency: 'BRL'
                }
            };
            
            const response = await axios.post(`${this.baseUrl}/api/auth/register`, userData);
            console.log('Usuário registrado:', response.data);
            
            this.token = response.data.data.token;
            this.user = response.data.data.user;
            
            return true;
        } catch (error) {
            console.error('Registro falhou:', error.response?.data || error.message);
            return false;
        }
    }
    
    async loginUser() {
        console.log('\n=== Fazendo Login ===');
        try {
            // Primeiro tenta fazer login com o admin
            const loginData = {
                identifier: 'admin@microservices.com',
                password: 'admin123'
            };
            
            const response = await axios.post(`${this.baseUrl}/api/auth/login`, loginData);
            console.log('Login realizado:', response.data);
            
            this.token = response.data.data.token;
            this.user = response.data.data.user;
            
            return true;
        } catch (error) {
            console.error('Login falhou:', error.response?.data || error.message);
            return false;
        }
    }
    
    async browseItems() {
        console.log('\n=== Navegando pelos Itens ===');
        try {
            // Listar categorias
            const categoriesResponse = await axios.get(`${this.baseUrl}/api/items/categories`);
            console.log('Categorias disponíveis:', categoriesResponse.data.data);
            
            // Listar itens de uma categoria
            const categories = categoriesResponse.data.data || [];
            if (!Array.isArray(categories) || categories.length === 0) {
                console.log('Nenhuma categoria disponível para busca.');
                return false;
            }

            let category;
            if (process.stdin.isTTY) {
                console.log('\nEscolha uma categoria:');
                categories.forEach((c, i) => {
                    // se c for objeto com nome, mostre o nome, senão mostre o valor
                    const label = (c && typeof c === 'object') ? (c.name || JSON.stringify(c)) : String(c);
                    console.log(`${i + 1}. ${label}`);
                });

                // Pergunta até receber uma opção válida ou 'c' para cancelar
                while (true) {
                    const ans = (await this.ask('\nDigite o número da categoria (ou C para cancelar): ')).trim();
                    if (!ans) {
                        console.log('Entrada vazia, tente novamente.');
                        continue;
                    }
                    if (/^c$/i.test(ans)) {
                        console.log('Busca cancelada pelo usuário.');
                        return false;
                    }
                    const idx = parseInt(ans, 10);
                    if (Number.isNaN(idx) || idx < 1 || idx > categories.length) {
                        console.log('Opção inválida, digite o número correspondente à categoria.');
                        continue;
                    }
                    const selected = categories[idx - 1];
                    category = (selected && typeof selected === 'object') ? (selected.name || String(selected)) : String(selected);
                    break;
                }
            } else {
                category = categories[0];
                console.log(`Usando categoria padrão: ${category}`);
            }

            const itemsResponse = await axios.get(`${this.baseUrl}/api/items?category=${encodeURIComponent(category)}&limit=5`);
                const items = itemsResponse.data.data;
                console.log(`Itens da categoria ${category}:`, items.length);

                // Mostrar todos os itens retornados (forma resumida)
                if (items.length > 0) {
                    console.log('Detalhes dos itens:');
                    items.forEach((it, i) => {
                        const name = it.name || '(sem nome)';
                        const id = it.id || '-';
                        const brand = it.brand ? ` | Marca: ${it.brand}` : '';
                        const unit = it.unit ? ` | Unidade: ${it.unit}` : '';
                        const price = (it.averagePrice !== undefined && it.averagePrice !== null) ? ` | Preço médio: R$ ${it.averagePrice}` : '';
                        const desc = it.description ? ` | ${it.description}` : '';
                        console.log(`${i + 1}. ${name} (id: ${id})${brand}${unit}${price}${desc}`);
                    });
                }
            
            return true;
        } catch (error) {
            console.error('Navegação de itens falhou:', error.response?.data || error.message);
            return false;
        }
    }
    
    async searchItems() {
        console.log('\n=== Buscando Itens ===');
        try {
            const searchResponse = await axios.get(`${this.baseUrl}/api/items/search?q=arroz`);
            console.log('Resultados da busca por "arroz":', searchResponse.data.data.length);
            
            return true;
        } catch (error) {
            console.error('Busca falhou:', error.response?.data || error.message);
            return false;
        }
    }
    
    async createList() {
        console.log('\n=== Criando Lista de Compras ===');
        try {
            const listData = {
                name: 'Minha Lista de Compras',
                description: 'Lista de compras da semana'
            };
            
            const response = await axios.post(`${this.baseUrl}/api/lists`, listData, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            
            this.listId = response.data.data.id;
            console.log('Lista criada:', response.data.data.name);
            
            return true;
        } catch (error) {
            console.error('Criação de lista falhou:', error.response?.data || error.message);
            return false;
        }
    }
    
    async addItemsToList() {
        console.log('\n=== Adicionando Itens à Lista ===');
        try {
            // Primeiro busca alguns itens
            const itemsResponse = await axios.get(`${this.baseUrl}/api/items?limit=3`);
            const items = itemsResponse.data.data;
            
            // Adiciona cada item à lista
            for (const item of items) {
                const addItemData = {
                    itemId: item.id,
                    quantity: Math.floor(Math.random() * 3) + 1,
                    notes: `Notas para ${item.name}`
                };
                
                await axios.post(`${this.baseUrl}/api/lists/${this.listId}/items`, addItemData, {
                    headers: { Authorization: `Bearer ${this.token}` }
                });
                
                console.log(`Item adicionado: ${item.name}`);
            }
            
            return true;
        } catch (error) {
            console.error('Adição de itens falhou:', error.response?.data || error.message);
            return false;
        }
    }
    
    async viewList() {
        console.log('\n=== Visualizando Lista ===');
        try {
            const response = await axios.get(`${this.baseUrl}/api/lists/${this.listId}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            
            console.log('Lista detalhada:');
            console.log(`- Nome: ${response.data.data.name}`);
            console.log(`- Itens: ${response.data.data.items.length}`);
            console.log(`- Total estimado: R$ ${response.data.data.summary.estimatedTotal}`);
            
            return true;
        } catch (error) {
            console.error('Visualização de lista falhou:', error.response?.data || error.message);
            return false;
        }
    }
    
    async testDashboard() {
        console.log('\n=== Testando Dashboard ===');
        try {
            const response = await axios.get(`${this.baseUrl}/api/dashboard`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            
            console.log('Dashboard:');
            console.log(`- Usuário: ${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
            console.log(`- Total de listas: ${response.data.data.statistics.totalLists}`);
            console.log(`- Listas ativas: ${response.data.data.statistics.activeLists}`);
            console.log(`- Total estimado: R$ ${response.data.data.statistics.totalEstimated}`);
            
            return true;
        } catch (error) {
            console.error('Dashboard falhou:', error.response?.data || error.message);
            return false;
        }
    }
    
    async testGlobalSearch() {
        console.log('\n=== Testando Busca Global ===');
        try {
            const response = await axios.get(`${this.baseUrl}/api/search?q=arroz`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            
            console.log('Busca global por "arroz":');
            console.log(`- Itens encontrados: ${response.data.data.items?.length || 0}`);
            
            if (response.data.data.lists) {
                console.log(`- Listas encontradas: ${response.data.data.lists.length}`);
            }
            
            return true;
        } catch (error) {
            console.error('Busca global falhou:', error.response?.data || error.message);
            return false;
        }
    }
    
    async runAllTests() {
        console.log('Iniciando demonstração do Sistema de Listas de Compras...\n');
        
        // Aguarda os serviços iniciarem
        console.log('Aguardando inicialização dos serviços...');
        await this.delay(3000);
        
        // Executa os testes em sequência
        const tests = [
            this.testHealth.bind(this),
            this.testRegistry.bind(this),
            this.loginUser.bind(this),
            this.browseItems.bind(this),
            this.searchItems.bind(this),
            this.createList.bind(this),
            this.addItemsToList.bind(this),
            this.viewList.bind(this),
            this.testDashboard.bind(this),
            this.testGlobalSearch.bind(this)
        ];
        
        for (const test of tests) {
            const success = await test();
            if (!success) {
                console.log('Teste falhou, continuando com próximo...');
            }
            await this.delay(1000);
        }
        
        console.log('\n=== Demonstração Concluída ===');
        console.log('Para testar manualmente:');
        console.log(`- Health Check: curl http://localhost:3000/health`);
        console.log(`- Service Registry: curl http://localhost:3000/registry`);
        console.log(`- API Gateway: curl http://localhost:3000/`);
    }

    // Interactive menu for running individual tests or all of them
    async showMenu() {
        const readline = require('readline');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const question = (q) => new Promise((resolve) => rl.question(q, resolve));

        const options = [
            'Testar Health Check',
            'Testar Service Registry',
            'Registrar Novo Usuário',
            'Fazer Login (admin)',
            'Navegar Itens',
            'Buscar Itens (arroz)',
            'Criar Lista',
            'Adicionar Itens à Lista',
            'Visualizar Lista',
            'Testar Dashboard',
            'Testar Busca Global',
            'Executar Todos os Testes (sequencial)',
            'Sair',
        ];

        let exit = false;
        while (!exit) {
            console.log('\n=== MENU INTERATIVO ===');
            options.forEach((opt, i) => console.log(`${i + 1}. ${opt}`));

            const ans = await question('\nEscolha uma opção (número): ');
            const choice = parseInt(ans, 10);
            if (Number.isNaN(choice) || choice < 1 || choice > options.length) {
                console.log('Opção inválida, tente novamente.');
                continue;
            }

            switch (choice) {
                case 1:
                    await this.testHealth();
                    break;
                case 2:
                    await this.testRegistry();
                    break;
                case 3:
                    await this.registerUser();
                    break;
                case 4:
                    await this.loginUser();
                    break;
                case 5:
                    await this.browseItems();
                    break;
                case 6:
                    await this.searchItems();
                    break;
                case 7:
                    if (!this.token) {
                        console.log('Ação requer autenticação. Faça login ou registre um usuário primeiro.');
                    } else {
                        await this.createList();
                    }
                    break;
                case 8:
                    if (!this.token) {
                        console.log('Ação requer autenticação. Faça login ou registre um usuário primeiro.');
                    } else if (!this.listId) {
                        console.log('Nenhuma lista criada. Execute "Criar Lista" antes.');
                    } else {
                        await this.addItemsToList();
                    }
                    break;
                case 9:
                    if (!this.token) {
                        console.log('Ação requer autenticação. Faça login ou registre um usuário primeiro.');
                    } else if (!this.listId) {
                        console.log('Nenhuma lista criada. Execute "Criar Lista" antes.');
                    } else {
                        await this.viewList();
                    }
                    break;
                case 10:
                    if (!this.token) {
                        console.log('Ação requer autenticação. Faça login ou registre um usuário primeiro.');
                    } else {
                        await this.testDashboard();
                    }
                    break;
                case 11:
                    if (!this.token) {
                        console.log('Ação requer autenticação. Faça login ou registre um usuário primeiro.');
                    } else {
                        await this.testGlobalSearch();
                    }
                    break;
                case 12:
                    await this.runAllTests();
                    break;
                case 13:
                    exit = true;
                    break;
                default:
                    console.log('Opção não implementada');
            }

            // pequena pausa entre operações
            await this.delay(500);
        }

        rl.close();
        console.log('Saindo do menu.');
    }
}

// Executa o menu interativo quando chamado diretamente
const demo = new ShoppingListDemo();
if (require.main === module) {
    demo.showMenu().catch(console.error);
}