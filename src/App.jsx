import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios'
import bgImage from './pokedex-background.webp'

function App() {
  const [search, setSearch] = useState('')
  const [allPokemon, setAllPokemon] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [pokemonDetails, setPokemonDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    const fetchAllPokemon = async () => {
      try {
        const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1025')
        const results = response.data.results

        const detailedPokemonPromises = results.map(async (pokemon) => {
          const res = await axios.get(pokemon.url)
          return res.data
        })

        const detailedPokemonData = await Promise.all(detailedPokemonPromises)
        setAllPokemon(detailedPokemonData)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching Pokémon list:", err)
        setLoading(false)
      }
    }

    fetchAllPokemon()
  }, [])

  const getGenerationAndRegion = (id) => {
    if (id <= 151) return { gen: 'Gen 1', region: 'Kanto' }
    if (id <= 251) return { gen: 'Gen 2', region: 'Johto' }
    if (id <= 386) return { gen: 'Gen 3', region: 'Hoenn' }
    if (id <= 493) return { gen: 'Gen 4', region: 'Sinnoh' }
    if (id <= 649) return { gen: 'Gen 5', region: 'Unova' }
    if (id <= 721) return { gen: 'Gen 6', region: 'Kalos' }
    if (id <= 809) return { gen: 'Gen 7', region: 'Alola' }
    if (id <= 905) return { gen: 'Gen 8', region: 'Galar' }
    return { gen: 'Gen 9', region: 'Paldea' }
  }

  const parseEvolutionChain = (chainNode) => {
    let evolutionNames = []
    let currentNode = chainNode
    
    while (currentNode) {
      evolutionNames.push(currentNode.species.name)
      if (currentNode.evolves_to && currentNode.evolves_to.length > 0) {
        currentNode = currentNode.evolves_to[0]
      } else {
        currentNode = null
      }
    }
    
    return evolutionNames
  }

  const handleCardClick = async (pokemon) => {
    setSelectedPokemon(pokemon)
    setLoadingDetails(true)
    try {
      const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`)
      
      const evolutionChainRes = await axios.get(speciesRes.data.evolution_chain.url)
      const chainNames = parseEvolutionChain(evolutionChainRes.data.chain)

      const hasEvolution = chainNames.length > 1

      setPokemonDetails({
        flavorText: speciesRes.data.flavor_text_entries.find(entry => entry.language.name === 'en')?.flavor_text.replace(/[\n\f]/g, ' ') || 'No description available.',
        habitat: speciesRes.data.habitat ? speciesRes.data.habitat.name : 'Unknown',
        evolutions: hasEvolution ? chainNames : []
      })
    } catch (err) {
      console.error("Error fetching extra details:", err)
      setPokemonDetails({ flavorText: 'Could not load details.', habitat: 'Unknown', evolutions: [] })
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleEvolutionClick = (evoName) => {
    const foundPokemon = allPokemon.find(p => p.name === evoName.toLowerCase())
    if (foundPokemon) {
      handleCardClick(foundPokemon)
    }
  }

  const closeModal = () => {
    setSelectedPokemon(null)
    setPokemonDetails(null)
  }

  const filteredPokemon = allPokemon.filter((p) => {
    const query = search.toLowerCase().trim()
    if (!query) return true
    return p.name.includes(query) || p.id.toString() === query
  })

  return (
    <div 
      className="container"
      style={{ 
        backgroundImage: `url(${bgImage})`,
        backgroundRepeat: 'repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      <h1>Pokédex Gallery</h1>
      
      <div className="search-box">
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Pokemon name or ID..."
        />
      </div>

      {loading ? (
        <p className="loading-msg">Loading all generations of Pokémon...</p>
      ) : (
        <div className="pokemon-grid">
          {filteredPokemon.length > 0 ? (
            filteredPokemon.map((pokemon) => {
              const info = getGenerationAndRegion(pokemon.id);
              return (
                <div className="pokemon-card" key={pokemon.id} onClick={() => handleCardClick(pokemon)}>
                  <span className="generation-badge">{info.gen}</span>
                  <span className="id">#{pokemon.id}</span>
                  
                  <img 
                    src={pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default} 
                    alt={pokemon.name} 
                  />
                  <h3 className="name">{pokemon.name.toUpperCase()}</h3>
                  <p className="region-name">{info.region} Region</p>
                  
                  <div className="types-container">
                    {pokemon.types.map((t) => {
                      const typeName = t.type.name;
                      return (
                        <span key={typeName} className={`type-badge type-${typeName}`}>
                          {typeName}
                        </span>
                      )
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="error-msg">No Pokémon found matching "{search}"</p>
          )}
        </div>
      )}

      {selectedPokemon && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>&times;</button>
            
            <div className="modal-header">
              <span className="generation-badge">{getGenerationAndRegion(selectedPokemon.id).gen}</span>
              <h2>{selectedPokemon.name.toUpperCase()} <span className="modal-id">#{selectedPokemon.id}</span></h2>
              <p className="modal-region">{getGenerationAndRegion(selectedPokemon.id).region} Region</p>
            </div>

            <img 
              src={selectedPokemon.sprites?.other?.['official-artwork']?.front_default || selectedPokemon.sprites?.front_default} 
              alt={selectedPokemon.name} 
              className="modal-img"
            />

            {loadingDetails ? (
              <p>Loading details...</p>
            ) : (
              <div className="modal-details">
                <p className="flavor-text">"{pokemonDetails?.flavorText}"</p>
                
                <div className="stats-grid">
                  <div><strong>Height:</strong> {selectedPokemon.height / 10} m</div>
                  <div><strong>Weight:</strong> {selectedPokemon.weight / 10} kg</div>
                  <div><strong>Habitat:</strong> {pokemonDetails?.habitat}</div>
                  <div><strong>Base Exp:</strong> {selectedPokemon.base_experience}</div>
                </div>

                <div className="section-title">Types</div>
                <div className="types-container">
                  {selectedPokemon.types.map((t) => {
                    const typeName = t.type.name;
                    return (
                      <span key={typeName} className={`type-badge type-${typeName}`}>
                        {typeName}
                      </span>
                    )
                  })}
                </div>

                <div className="section-title">Abilities</div>
                <div className="abilities-list">
                  {selectedPokemon.abilities.map((a) => (
                    <span key={a.ability.name} className="ability-badge">
                      {a.ability.name} {a.is_hidden && '(Hidden)'}
                    </span>
                  ))}
                </div>

                {pokemonDetails?.evolutions && pokemonDetails.evolutions.length > 1 && (
                  <>
                    <div className="section-title">Evolution Chain</div>
                    <div className="evolution-list">
                      {pokemonDetails.evolutions.map((evoName, index) => (
                        <span key={evoName} className="evolution-wrapper">
                          <span 
                            className="evolution-badge clickable" 
                            onClick={() => handleEvolutionClick(evoName)}
                          >
                            {evoName.toUpperCase()}
                          </span>
                          {index < pokemonDetails.evolutions.length - 1 && <span className="evolution-arrow"> ➔ </span>}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                <div className="section-title">Base Stats</div>
                <div className="base-stats">
                  {selectedPokemon.stats.map((s) => (
                    <div key={s.stat.name} className="stat-row">
                      <span className="stat-name">{s.stat.name.toUpperCase()}:</span>
                      <span className="stat-value">{s.base_stat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App