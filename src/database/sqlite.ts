// SQLite Database Configuration
// Voor nu gebruiken we localStorage als mock database
// Later kun je dit vervangen met een echte SQLite implementatie

export interface Model {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  age: number;
  instagram: string;
  email: string;
  phone: string;
  city: string;
  photo_url: string | null;
  contract_pdf: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  last_login: string;
}

const DB_KEY_MODELS = 'unposed_models';
const DB_KEY_EMPLOYEES = 'unposed_employees';

// Initialize database met sample data
export const initDatabase = () => {
  if (!localStorage.getItem(DB_KEY_MODELS)) {
    const sampleModels: Model[] = [
      {
        id: '1',
        first_name: 'Emma',
        last_name: 'Jansen',
        gender: 'vrouw',
        age: 22,
        instagram: '@emma.jansen',
        email: 'emma@example.com',
        phone: '06 12345678',
        city: 'Rotterdam',
        photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        contract_pdf: null,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        first_name: 'Liam',
        last_name: 'van Dijk',
        gender: 'man',
        age: 19,
        instagram: '@liam.dijk',
        email: 'liam@example.com',
        phone: '06 23456789',
        city: 'Amsterdam',
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        contract_pdf: null,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        first_name: 'Sophie',
        last_name: 'Bakker',
        gender: 'vrouw',
        age: 24,
        instagram: '@sophie.bakker',
        email: 'sophie@example.com',
        phone: '06 34567890',
        city: 'Utrecht',
        photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
        contract_pdf: null,
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        first_name: 'Noah',
        last_name: 'de Vries',
        gender: 'man',
        age: 21,
        instagram: '@noah.devries',
        email: 'noah@example.com',
        phone: '06 45678901',
        city: 'Den Haag',
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        contract_pdf: null,
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        first_name: 'Julia',
        last_name: 'Visser',
        gender: 'vrouw',
        age: 26,
        instagram: '@julia.visser',
        email: 'julia@example.com',
        phone: '06 56789012',
        city: 'Rotterdam',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
        contract_pdf: null,
        created_at: new Date().toISOString()
      },
      {
        id: '6',
        first_name: 'Daan',
        last_name: 'Hendriks',
        gender: 'man',
        age: 28,
        instagram: '@daan.hendriks',
        email: 'daan@example.com',
        phone: '06 67890123',
        city: 'Eindhoven',
        photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
        contract_pdf: null,
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(DB_KEY_MODELS, JSON.stringify(sampleModels));
  }

  if (!localStorage.getItem(DB_KEY_EMPLOYEES)) {
    const sampleEmployees: Employee[] = [
      {
        id: '1',
        name: 'Kate Beker',
        email: 'hello@unposed.nl',
        last_login: new Date().toISOString()
      }
    ];
    localStorage.setItem(DB_KEY_EMPLOYEES, JSON.stringify(sampleEmployees));
  }
};

// Models CRUD operations
export const getAllModels = (): Model[] => {
  const data = localStorage.getItem(DB_KEY_MODELS);
  return data ? JSON.parse(data) : [];
};

export const addModel = (model: Omit<Model, 'id' | 'created_at'>): Model => {
  const models = getAllModels();
  const newModel: Model = {
    ...model,
    id: Date.now().toString(),
    created_at: new Date().toISOString()
  };
  models.push(newModel);
  localStorage.setItem(DB_KEY_MODELS, JSON.stringify(models));
  return newModel;
};

export const deleteModel = (id: string): boolean => {
  const models = getAllModels();
  const filtered = models.filter(m => m.id !== id);
  localStorage.setItem(DB_KEY_MODELS, JSON.stringify(filtered));
  return true;
};

export const updateModel = (id: string, updates: Partial<Model>): Model | null => {
  const models = getAllModels();
  const index = models.findIndex(m => m.id === id);
  if (index === -1) return null;
  
  models[index] = { ...models[index], ...updates };
  localStorage.setItem(DB_KEY_MODELS, JSON.stringify(models));
  return models[index];
};

// Employees operations
export const getAllEmployees = (): Employee[] => {
  const data = localStorage.getItem(DB_KEY_EMPLOYEES);
  return data ? JSON.parse(data) : [];
};

export const getLoggedInEmployees = (): Employee[] => {
  const employees = getAllEmployees();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return employees.filter(emp => new Date(emp.last_login) > fiveMinutesAgo);
};

export const loginEmployee = (name: string, email: string): Employee => {
  const employees = getAllEmployees();
  const existing = employees.find(e => e.email === email);
  
  if (existing) {
    existing.last_login = new Date().toISOString();
    localStorage.setItem(DB_KEY_EMPLOYEES, JSON.stringify(employees));
    return existing;
  } else {
    const newEmployee: Employee = {
      id: Date.now().toString(),
      name,
      email,
      last_login: new Date().toISOString()
    };
    employees.push(newEmployee);
    localStorage.setItem(DB_KEY_EMPLOYEES, JSON.stringify(employees));
    return newEmployee;
  }
};

export const logoutEmployee = (email: string): void => {
  const employees = getAllEmployees();
  const filtered = employees.filter(e => e.email !== email);
  localStorage.setItem(DB_KEY_EMPLOYEES, JSON.stringify(filtered));
};
