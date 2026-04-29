// Servidor Node.js con Express y MongoDB - Blog de Teorías Conspirativas
// Instalar: npm install express cors mongoose

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ========== CONEXIÓN A MONGODB ==========
async function conectarDB() {
  try {
    console.log("🔍 Conectando a MongoDB...");
    
    await mongoose.connect("mongodb://Carlos:jc42336010@ac-reuezjg-shard-00-00.ydsb1xa.mongodb.net:27017,ac-reuezjg-shard-00-01.ydsb1xa.mongodb.net:27017,ac-reuezjg-shard-00-02.ydsb1xa.mongodb.net:27017/teorias_db?ssl=true&replicaSet=atlas-1xv8ax-shard-0&authSource=admin&appName=Cluster0");
    
    console.log("✅ Conectado exitosamente a MongoDB - Base de datos: teorias_db");
    
    // Sembrar datos iniciales si la colección está vacía
    await sembrarDatosIniciales();
    
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    process.exit(1);
  }
}

// ========== MODELO DE TEORÍA ==========
const teoriaSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  nombre: { type: String, required: true },
  porcentajeCredibilidad: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  categoria: { 
    type: String, 
    default: "Sin clasificar" 
  },
  descripcion: { 
    type: String, 
    required: true 
  },
  estadoVigencia: { 
    type: String, 
    enum: ['Activa', 'Desmentida', 'En investigación'],
    default: 'En investigación' 
  },
  añoOrigen: { 
    type: Number, 
    default: new Date().getFullYear() 
  }
}, { 
  timestamps: true,
  collection: 'teorias' // Nombre de la colección en MongoDB
});

const Teoria = mongoose.model('Teoria', teoriaSchema);

// ========== FUNCIONES AUXILIARES ==========

// Obtener siguiente ID secuencial
async function obtenerSiguienteId() {
  try {
    const ultimaTeoria = await Teoria.findOne()
      .sort({ id: -1 })
      .select('id')
      .lean();
    
    return ultimaTeoria && ultimaTeoria.id ? ultimaTeoria.id + 1 : 1;
  } catch (error) {
    console.error("Error obteniendo siguiente ID:", error);
    return Date.now();
  }
}

// Sembrar datos iniciales si la colección está vacía
async function sembrarDatosIniciales() {
  try {
    const count = await Teoria.countDocuments();
    
    if (count === 0) {
      console.log("🌱 Sembrando datos iniciales de teorías conspirativas...");
      
      const teoriasIniciales = [
        { 
          id: 1,
          nombre: "Tierra Plana", 
          porcentajeCredibilidad: 15,
          categoria: "Pseudoastronomía",
          descripcion: "La Tierra es un disco plano rodeado por un muro de hielo. La NASA y los gobiernos ocultan la verdad.",
          estadoVigencia: "Desmentida",
          añoOrigen: 1850
        },
        { 
          id: 2,
          nombre: "Reptilianos", 
          porcentajeCredibilidad: 8,
          categoria: "Seres Ocultos",
          descripcion: "Seres reptiloides que controlan gobiernos mundiales disfrazados de humanos. Cambian de forma.",
          estadoVigencia: "En investigación",
          añoOrigen: 1999
        },
        { 
          id: 3,
          nombre: "Falso Alunizaje", 
          porcentajeCredibilidad: 12,
          categoria: "Tecnología",
          descripcion: "El hombre nunca llegó a la luna, fue filmado en un estudio de Hollywood con Kubrick.",
          estadoVigencia: "Desmentida",
          añoOrigen: 1969
        },
        { 
          id: 4,
          nombre: "Pájaros Drones", 
          porcentajeCredibilidad: 25,
          categoria: "Vigilancia",
          descripcion: "Las aves son en realidad drones del gobierno que vigilan a la población y recargan en cables eléctricos.",
          estadoVigencia: "Activa",
          añoOrigen: 2013
        }
      ];
      
      await Teoria.insertMany(teoriasIniciales);
      console.log("✅ Datos iniciales sembrados exitosamente");
    }
  } catch (error) {
    console.error("Error sembrando datos:", error);
  }
}

// ========== ENDPOINTS CRUD ==========

// GET - Obtener todas las teorías
app.get('/api/teorias', async (req, res) => {
  try {
    const teorias = await Teoria.find({}).sort({ id: 1 });
    res.json(teorias);
  } catch (error) {
    console.error("Error GET /api/teorias:", error);
    res.status(500).json({ error: 'El gobierno está interfiriendo nuestras comunicaciones. Intenta de nuevo.' });
  }
});

// GET - Obtener una teoría por ID
app.get('/api/teorias/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let query;
    
    // Buscar por _id de MongoDB o por id secuencial
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { id: parseInt(id) };
    }
    
    const teoria = await Teoria.findOne(query);
    
    if (!teoria) {
      return res.status(404).json({ 
        error: 'Sabemos que buscaste esto. Borra tu historial. Ya te estamos observando.' 
      });
    }
    
    res.json(teoria);
  } catch (error) {
    console.error("Error GET /api/teorias/:id:", error);
    res.status(500).json({ error: 'Error al buscar la teoría. Los hombres de negro vienen por ti.' });
  }
});

// POST - Crear nueva teoría
app.post('/api/teorias', async (req, res) => {
  try {
    const { nombre, porcentajeCredibilidad, categoria, descripcion, estadoVigencia, añoOrigen } = req.body;
    
    if (!nombre || !descripcion) {
      return res.status(400).json({ 
        error: 'No puedes ocultar la verdad para siempre. Completa ambos campos o sabremos dónde encontrarte.' 
      });
    }
    
    // Validar porcentaje de credibilidad (0-100)
    let credibilidad = parseInt(porcentajeCredibilidad);
    if (isNaN(credibilidad)) credibilidad = 0;
    if (credibilidad < 0) credibilidad = 0;
    if (credibilidad > 100) credibilidad = 100;
    
    // Validar estado de vigencia
    const estadosValidos = ['Activa', 'Desmentida', 'En investigación'];
    const estadoFinal = estadosValidos.includes(estadoVigencia) ? estadoVigencia : 'En investigación';
    
    // Obtener siguiente ID
    const siguienteId = await obtenerSiguienteId();
    
    const nuevaTeoria = new Teoria({
      id: siguienteId,
      nombre: nombre,
      porcentajeCredibilidad: credibilidad,
      categoria: categoria || "Sin clasificar",
      descripcion: descripcion,
      estadoVigencia: estadoFinal,
      añoOrigen: parseInt(añoOrigen) || new Date().getFullYear()
    });
    
    await nuevaTeoria.save();
    console.log(`✅ Nueva teoría creada: "${nombre}" (ID: ${siguienteId})`);
    
    res.status(201).json(nuevaTeoria);
  } catch (error) {
    console.error("Error POST /api/teorias:", error);
    res.status(400).json({ error: 'Error al crear la teoría: ' + error.message });
  }
});

// PUT - Actualizar teoría completa
app.put('/api/teorias/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, porcentajeCredibilidad, categoria, descripcion, estadoVigencia, añoOrigen } = req.body;
    
    // Determinar query
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { id: parseInt(id) };
    }
    
    const teoria = await Teoria.findOne(query);
    
    if (!teoria) {
      return res.status(404).json({ 
        error: 'Esa teoría nunca existió... o tal vez la eliminamos nosotros. Deja de investigar.' 
      });
    }
    
    // Validar porcentaje de credibilidad
    if (porcentajeCredibilidad !== undefined) {
      let credibilidad = parseInt(porcentajeCredibilidad);
      if (isNaN(credibilidad)) credibilidad = teoria.porcentajeCredibilidad;
      if (credibilidad < 0) credibilidad = 0;
      if (credibilidad > 100) credibilidad = 100;
      teoria.porcentajeCredibilidad = credibilidad;
    }
    
    // Validar estado de vigencia
    if (estadoVigencia !== undefined) {
      const estadosValidos = ['Activa', 'Desmentida', 'En investigación'];
      if (estadosValidos.includes(estadoVigencia)) {
        teoria.estadoVigencia = estadoVigencia;
      }
    }
    
    // Actualizar campos
    if (nombre) teoria.nombre = nombre;
    if (categoria) teoria.categoria = categoria;
    if (descripcion) teoria.descripcion = descripcion;
    if (añoOrigen !== undefined) teoria.añoOrigen = parseInt(añoOrigen);
    
    await teoria.save();
    console.log(`✅ Teoría actualizada: "${teoria.nombre}"`);
    
    res.json(teoria);
  } catch (error) {
    console.error("Error PUT /api/teorias/:id:", error);
    res.status(400).json({ error: 'Error al actualizar: ' + error.message });
  }
});

// DELETE - Eliminar teoría
app.delete('/api/teorias/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Determinar query
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { id: parseInt(id) };
    }
    
    const teoriaEliminada = await Teoria.findOneAndDelete(query);
    
    if (!teoriaEliminada) {
      return res.status(404).json({ 
        error: 'No encontrarás lo que buscas. Olvida que esto existió. Por tu bien.' 
      });
    }
    
    console.log(`🗑️ Teoría eliminada: "${teoriaEliminada.nombre}"`);
    
    res.status(200).json({ 
      mensaje: `Teoría "${teoriaEliminada.nombre}" ha sido eliminada de los registros oficiales. Nunca existió.`,
      teoria: teoriaEliminada
    });
  } catch (error) {
    console.error("Error DELETE /api/teorias/:id:", error);
    res.status(500).json({ error: 'Error al eliminar la teoría.' });
  }
});

// ========== ENDPOINTS EXTRA ==========

// GET - Filtrar por categoría
app.get('/api/teorias/filtro/categoria/:categoria', async (req, res) => {
  try {
    const categoria = req.params.categoria;
    const filtradas = await Teoria.find({ categoria: categoria }).sort({ id: 1 });
    res.json(filtradas);
  } catch (error) {
    res.status(500).json({ error: 'Error al filtrar por categoría.' });
  }
});

// GET - Filtrar por estado de vigencia
app.get('/api/teorias/filtro/estado/:estado', async (req, res) => {
  try {
    const estado = req.params.estado;
    const filtradas = await Teoria.find({ estadoVigencia: estado }).sort({ id: 1 });
    res.json(filtradas);
  } catch (error) {
    res.status(500).json({ error: 'Error al filtrar por estado.' });
  }
});

// GET - Filtrar por rango de credibilidad
app.get('/api/teorias/filtro/credibilidad/:min/:max', async (req, res) => {
  try {
    const min = parseInt(req.params.min) || 0;
    const max = parseInt(req.params.max) || 100;
    
    const filtradas = await Teoria.find({
      porcentajeCredibilidad: { $gte: min, $lte: max }
    }).sort({ porcentajeCredibilidad: -1 });
    
    res.json(filtradas);
  } catch (error) {
    res.status(500).json({ error: 'Error al filtrar por credibilidad.' });
  }
});

// GET - Estadísticas (para los conspiranoicos)
app.get('/api/estadisticas', async (req, res) => {
  try {
    const teorias = await Teoria.find({});
    
    if (teorias.length === 0) {
      return res.json({ mensaje: 'No hay teorías. El gobierno ha eliminado toda evidencia.' });
    }
    
    const totalCredibilidad = teorias.reduce((sum, t) => sum + t.porcentajeCredibilidad, 0);
    const promedioCredibilidad = (totalCredibilidad / teorias.length).toFixed(1);
    
    const estados = {
      Activa: teorias.filter(t => t.estadoVigencia === "Activa").length,
      Desmentida: teorias.filter(t => t.estadoVigencia === "Desmentida").length,
      EnInvestigacion: teorias.filter(t => t.estadoVigencia === "En investigación").length
    };
    
    const categorias = {};
    teorias.forEach(t => {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + 1;
    });
    
    const teoriaMasCreible = teorias.reduce((a, b) => 
      (a.porcentajeCredibilidad > b.porcentajeCredibilidad ? a : b)
    );
    
    const teoriaMenosCreible = teorias.reduce((a, b) => 
      (a.porcentajeCredibilidad < b.porcentajeCredibilidad ? a : b)
    );
    
    res.json({
      totalTeorias: teorias.length,
      promedioCredibilidad: promedioCredibilidad + '%',
      distribucionEstados: estados,
      distribucionCategorias: categorias,
      teoriaMasAntigua: teorias.reduce((a, b) => (a.añoOrigen < b.añoOrigen ? a : b)),
      teoriaMasReciente: teorias.reduce((a, b) => (a.añoOrigen > b.añoOrigen ? a : b)),
      teoriaMasCreible: {
        nombre: teoriaMasCreible.nombre,
        porcentajeCredibilidad: teoriaMasCreible.porcentajeCredibilidad + '%'
      },
      teoriaMenosCreible: {
        nombre: teoriaMenosCreible.nombre,
        porcentajeCredibilidad: teoriaMenosCreible.porcentajeCredibilidad + '%'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
});

// Ruta principal - Servir el HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ========== INICIAR SERVIDOR ==========
async function iniciarServidor() {
  await conectarDB();
  
  app.listen(PORT, () => {
    console.log(`
    🛸 Servidor corriendo en: http://localhost:${PORT}
    
    📡 Endpoints disponibles:
    GET    /api/teorias                    - Obtener todas las teorías
    GET    /api/teorias/:id                - Obtener una teoría
    POST   /api/teorias                    - Crear nueva teoría
    PUT    /api/teorias/:id                - Actualizar teoría
    DELETE /api/teorias/:id                - Eliminar teoría
    GET    /api/teorias/filtro/categoria/:cat  - Filtrar por categoría
    GET    /api/teorias/filtro/estado/:est     - Filtrar por estado
    GET    /api/teorias/filtro/credibilidad/:min/:max - Filtrar por credibilidad
    GET    /api/estadisticas               - Estadísticas conspirativas
    `);
  });
}

iniciarServidor();