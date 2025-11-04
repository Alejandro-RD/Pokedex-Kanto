// lib/main.dart

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http; // Paquete para peticiones HTTP
import 'dart:convert'; // Para convertir JSON

// ⚠️ IMPORTANTE: REEMPLAZA CON TU URL REAL DE RENDER
const String apiUrl = 'https://pokedex-api-o6hc.onrender.com/api/pokemon';

void main() {
  runApp(const PokedexApp());
}

// =======================================================================
// 1. MODELO DE DATOS (POKEMON)
// =======================================================================

class Pokemon {
  final int id;
  final String name;
  final List<String> type;
  final String exclusivo;
  // bool capturado; // (Se añadiría para la lógica de persistencia real)

  Pokemon({
    required this.id,
    required this.name,
    required this.type,
    required this.exclusivo,
    // this.capturado = false,
  });

  // Constructor para crear un objeto Pokemon desde JSON
  factory Pokemon.fromJson(Map<String, dynamic> json) {
    // La API de Flask devuelve 'type' como un array de strings
    List<String> typesList = [];
    if (json['type'] is List) {
      typesList = List<String>.from(json['type']);
    } else if (json['type'] is String) {
      // Esto maneja el caso de que Flask haya devuelto el string separado por comas
      typesList = (json['type'] as String).split(',');
    }

    return Pokemon(
      id: json['id'],
      name: json['name'],
      type: typesList.where((t) => t.isNotEmpty).toList(), // Filtra strings vacíos
      exclusivo: json['exclusivo'],
    );
  }
}

// =======================================================================
// 2. WIDGETS AUXILIARES (TIPOS)
// =======================================================================

Color _getTypeColor(String type) {
  switch (type.toLowerCase()) {
    case 'planta': return Colors.green[600]!;
    case 'veneno': return Colors.purple[600]!;
    case 'fuego': return Colors.deepOrange[700]!;
    case 'agua': return Colors.blue[600]!;
    case 'bicho': return Colors.lightGreen[700]!;
    case 'normal': return Colors.brown[300]!;
    case 'eléctrico': return Colors.amber[600]!;
    case 'tierra': return Colors.orange[800]!;
    case 'lucha': return Colors.red[800]!;
    case 'psíquico': return Colors.pink[400]!;
    case 'roca': return Colors.brown[600]!;
    case 'fantasma': return Colors.indigo[400]!;
    default: return Colors.grey;
  }
}

// lib/main.dart (Dentro de la clase TypeChip)

class TypeChip extends StatelessWidget {
  final String type;

  const TypeChip({required this.type, super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2.0),
      child: Chip(
        // Ajustamos el padding para hacerlo más compacto
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        labelPadding: const EdgeInsets.symmetric(horizontal: 2.0, vertical: 0), // Padding horizontal y vertical mínimo

        label: Text(
          type,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 10, // Tamaño de fuente pequeño (ajustar según necesidad)
          ),
        ),
        backgroundColor: _getTypeColor(type),
        // Eliminamos el padding anterior y usamos el nuevo labelPadding
      ),
    );
  }
}

// =======================================================================
// 3. WIDGET PRINCIPAL DE LA APLICACIÓN
// =======================================================================

class PokedexApp extends StatelessWidget {
  const PokedexApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pokédex Kanto (RF/VH)',
      theme: ThemeData(
        primarySwatch: Colors.red,
        scaffoldBackgroundColor: Colors.grey[200],
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFCC0000), // Rojo Fuego GBA
          foregroundColor: Colors.white,
        ),
      ),
      home: const PokedexHomePage(),
    );
  }
}

class PokedexHomePage extends StatefulWidget {
  const PokedexHomePage({super.key});

  @override
  State<PokedexHomePage> createState() => _PokedexHomePageState();
}

class _PokedexHomePageState extends State<PokedexHomePage> {
  late Future<List<Pokemon>> futurePokemon;

  @override
  void initState() {
    super.initState();
    futurePokemon = fetchPokemon();
  }

  // Función para obtener los datos de la API de Render
  Future<List<Pokemon>> fetchPokemon() async {
    final response = await http.get(Uri.parse(apiUrl));

    if (response.statusCode == 200) {
      List jsonResponse = json.decode(utf8.decode(response.bodyBytes)); // Decodificación robusta
      return jsonResponse.map((data) => Pokemon.fromJson(data)).toList();
    } else {
      throw Exception('Fallo al cargar la Pokédex. Código: ${response.statusCode}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pokédex Kanto (RF/VH)'),
        centerTitle: true,
        // Aquí se añadirían filtros/botones de búsqueda en el futuro
      ),
      body: FutureBuilder<List<Pokemon>>(
        future: futurePokemon,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            // Muestra un indicador de carga mientras espera la respuesta
            return const Center(child: CircularProgressIndicator(color: Color(0xFFCC0000)));
          } else if (snapshot.hasError) {
            // Muestra un mensaje de error si falla la conexión
            return Center(child: Text('Error de conexión: ${snapshot.error}.'));
          } else if (snapshot.hasData) {
            // Muestra la cuadrícula de tarjetas
            return GridView.builder(
              padding: const EdgeInsets.all(8.0),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                childAspectRatio: 0.58,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                final pokemon = snapshot.data![index];

                return Card(
                  color: Colors.grey[100],
                  elevation: 4,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.0),
                    side: const BorderSide(color: Color(0xFFCC0000), width: 1.5),
                  ),
                  child: InkWell(
                    onTap: () {
                      // ACCIÓN RÁPIDA DE CAPTURA (Futura implementación)
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Clic en ${pokemon.name} - Próxima acción: Marcar Capturado')),
                      );
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(0.5),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Número de Pokédex
                          Text(
                            '#${pokemon.id.toString().padLeft(3, '0')}',
                            style: TextStyle(color: Colors.grey[600], fontSize: 12),
                          ),

                          // Imagen del Pokémon
                          Image.network(
                            'https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${pokemon.id.toString().padLeft(3, '0')}.png',
                            height: 70,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return const SizedBox(height: 60, child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: Colors.grey)));
                            },
                          ),

                          const SizedBox(height: 5),

                          // Nombre del Pokémon
                          Text(
                            pokemon.name,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            textAlign: TextAlign.center,
                          ),

                          // Tipos
                          Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Wrap( // <--- ¡AQUÍ ESTÁ EL CAMBIO CLAVE!
                              alignment: WrapAlignment.center, // Centra los chips
                              spacing: 4.0, // Espacio horizontal entre chips
                              runSpacing: 4.0, // Espacio vertical entre líneas (si se envuelven)
                              children: pokemon.type.map((type) => TypeChip(type: type)).toList(),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          }
          return const Center(child: Text("Cargando..."));
        },
      ),
    );
  }
}