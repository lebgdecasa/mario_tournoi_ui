import React, { useState, useEffect, useMemo } from 'react';
// Local GIF assets
// (Supprimé) blue shell & lightning gifs après retrait de la fonctionnalité ItemBox
import kingOfDaresGif from './assets/king-of-dares.gif';
import biggestDrinkerGif from './assets/biggest-drinker.gif';
import bulletBillGif from './assets/bullet-bill.gif';
// Player photos
import linaImg from './assets/players/lina.png';
import malikLemsImg from './assets/players/malik-lems.png';
import jadboImg from './assets/players/jadbo.png';
import berbImg from './assets/players/berb.png';
import nadegeImg from './assets/players/nadege.png';
import jadlahImg from './assets/players/jadlah.png';
import midouImg from './assets/players/midou.png';
import { ChevronsRight, Crown, Dices, GlassWater, Skull, Trophy, Trash2, UserPlus, X, TrendingUp } from 'lucide-react';

// STYLES CSS (intégrés pour la simplicité)
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  .font-press-start {
    font-family: 'Press Start 2P', cursive;
  }

  .player-card {
    transition: all 0.3s ease;
    border-width: 4px;
  }

  .player-card.selected {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.7);
  }

  .player-card.disabled {
    filter: grayscale(80%) brightness(0.7);
  }

    .player-photo-square {
        width: 128px;
        height: 128px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #111827;
        border-radius: 0.5rem;
        overflow: hidden;
    }
    .player-photo-square img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        image-rendering: pixelated;
    }

  .podium-base {
    background: #374151;
    clip-path: polygon(0 15%, 100% 0, 100% 100%, 0 100%);
  }

  .podium-step {
    transition: transform 0.3s ease-in-out;
  }
  .podium-step:hover {
    transform: translateY(-15px);
  }

  .fade-in {
    animation: fadeIn 0.5s ease-in-out forwards;
  }

  .zoom-in {
    animation: zoomIn 0.4s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
  }

  .slide-in-bottom {
    animation: slideInBottom 0.7s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes zoomIn {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes slideInBottom {
    0% {
      transform: translateY(100px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

// HOOK POUR LA PERSISTANCE DES DONNÉES
function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
            return storedValue ? (JSON.parse(storedValue) as T) : defaultValue;
    } catch (error) {
      console.error("Erreur de lecture du localStorage", error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Erreur d'écriture dans le localStorage", error);
    }
  }, [key, state]);

    return [state, setState];
}

// TYPES DE DONNÉES
type Player = {
    id: number;
    name: string;
    photoUrl: string;
    color: string; // couleur unique attribuée au joueur
};

type TournamentPlayer = Player & {
  score: number;
  racesPlayed: number;
  daresAccepted: number;
  shotsTaken: number;
    worstRank: number; // pire rang atteint (valeur la plus haute). Sert à calculer la remontada.
};

type Race = TournamentPlayer[];

// ItemBoxEvent supprimé (fonctionnalité retirée)

// Palette de couleurs distinctes (peut être étendue)
const COLOR_PALETTE = [
    '#F87171', // red
    '#60A5FA', // blue
    '#34D399', // green
    '#FBBF24', // amber
    '#A78BFA', // violet
    '#F472B6', // pink
    '#10B981', // emerald
    '#F59E0B', // orange
    '#6366F1', // indigo
    '#EC4899', // fuchsia
    '#84CC16', // lime
    '#14B8A6', // teal
];

const INITIAL_PLAYERS: Player[] = [
    { id: 1, name: 'Lina', photoUrl: linaImg, color: COLOR_PALETTE[0] },
    { id: 2, name: 'Malik Lems', photoUrl: malikLemsImg, color: COLOR_PALETTE[1] },
    { id: 3, name: 'Bench', photoUrl: 'https://placehold.co/150x150/34D399/FFFFFF?text=Bench', color: COLOR_PALETTE[2] },
    { id: 4, name: 'Cous Bench', photoUrl: 'https://placehold.co/150x150/FBBF24/FFFFFF?text=Cous+Bench', color: COLOR_PALETTE[3] },
    { id: 5, name: 'JadBo', photoUrl: jadboImg, color: COLOR_PALETTE[4] },
    { id: 6, name: 'Berb', photoUrl: berbImg, color: COLOR_PALETTE[5] },
    { id: 7, name: 'Nadège', photoUrl: nadegeImg, color: COLOR_PALETTE[6] },
    { id: 8, name: 'JadLah', photoUrl: jadlahImg, color: COLOR_PALETTE[7] },
    { id: 9, name: 'Abdel', photoUrl: 'https://placehold.co/150x150/6366F1/FFFFFF?text=Abdel', color: COLOR_PALETTE[8] },
    { id: 10, name: 'Nasser', photoUrl: 'https://placehold.co/150x150/EC4899/FFFFFF?text=Nas', color: COLOR_PALETTE[9] },
    { id: 11, name: 'Midou', photoUrl: midouImg, color: COLOR_PALETTE[10] },
    { id: 12, name: 'MalikBo', photoUrl: 'https://placehold.co/150x150/14B8A6/FFFFFF?text=MBo', color: COLOR_PALETTE[11] },
];

// Les gages sont désormais définis par le vainqueur de la course (pas de liste prédéfinie)

// (Supprimé) Constante ITEM_BOX_EVENTS

// COMPOSANT CONFETTIS
interface SimpleConfettiProps { isActive: boolean; }
interface ConfettiParticle { x: number; y: number; radius: number; color: string; speed: number; tilt: number; tiltAngle: number; tiltAngleIncrement: number; }
const SimpleConfetti: React.FC<SimpleConfettiProps> = ({ isActive }) => {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isActive || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        let animationFrameId: number;
        const confetti: ConfettiParticle[] = Array.from({ length: 200 }, () => ({
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height - dimensions.height,
            radius: Math.random() * 5 + 2,
            color: `hsl(${Math.random() * 360}, 100%, 70%)`,
            speed: Math.random() * 3 + 1,
            tilt: Math.random() * 10 - 5,
            tiltAngle: 0,
            tiltAngleIncrement: Math.random() * 0.1 + 0.05
        }));

        const draw = () => {
            if (!canvasRef.current) return;
            context.clearRect(0, 0, dimensions.width, dimensions.height);
            confetti.forEach((p, i) => {
                context.beginPath();
                context.lineWidth = p.radius * 2;
                context.strokeStyle = p.color;
                context.moveTo(p.x + p.tilt, p.y);
                context.lineTo(p.x, p.y + p.tilt + p.radius);
                context.stroke();
                p.y += p.speed;
                p.tiltAngle += p.tiltAngleIncrement;
                p.tilt = Math.sin(p.tiltAngle) * 15;
                if (p.y > dimensions.height) {
                    confetti[i] = { ...p, x: Math.random() * dimensions.width, y: -20 };
                }
            });
            animationFrameId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isActive, dimensions]);

    if (!isActive) return null;
    return <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }} />;
};


// COMPOSANTS DE L'UI
interface PlayerSetupProps {
    allPlayers: Player[];
    setAllPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    selectedPlayerIds: number[];
    setSelectedPlayerIds: React.Dispatch<React.SetStateAction<number[]>>;
    onConfirm: () => void;
}
const PlayerSetup: React.FC<PlayerSetupProps> = ({ allPlayers, setAllPlayers, selectedPlayerIds, setSelectedPlayerIds, onConfirm }) => {
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerPhoto, setNewPlayerPhoto] = useState('');

    const handleAddPlayer = () => {
        if (newPlayerName.trim()) {
            const existingColors = new Set(allPlayers.map(p => p.color).filter(Boolean));
            let color = COLOR_PALETTE.find(c => !existingColors.has(c)) || COLOR_PALETTE[allPlayers.length % COLOR_PALETTE.length];
            const initials = (newPlayerName.trim().replace(/[^A-Za-z0-9]/g,'').toUpperCase() || '??').slice(0,3);
            const newPlayer: Player = {
                id: Date.now(),
                name: newPlayerName.trim(),
                photoUrl: newPlayerPhoto.trim() || `https://placehold.co/150x150/${color.replace('#','')}/FFFFFF?text=${initials}`,
                color
            };
            setAllPlayers(prev => [...prev, newPlayer]);
            setNewPlayerName('');
            setNewPlayerPhoto('');
        }
    };

    const handleDeletePlayer = (id: number) => {
        setAllPlayers(prev => prev.filter(p => p.id !== id));
        setSelectedPlayerIds(prev => prev.filter(pId => pId !== id));
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8 fade-in">
            <h1 className="font-press-start text-3xl md:text-5xl text-center text-yellow-300 mb-2">MARIO KART</h1>
            <h2 className="font-press-start text-xl md:text-3xl text-center text-white mb-8">TOURNAMENT OF SHAME</h2>
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border-2 border-gray-700">
                <h3 className="text-2xl font-bold text-center text-white mb-6">Qui sont les challengers ce soir ?</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                    {allPlayers.map(player => (
                        <div key={player.id} className="relative">
                            <div onClick={() => setSelectedPlayerIds(prev => prev.includes(player.id) ? prev.filter(pId => pId !== player.id) : [...prev, player.id])} className={`player-card bg-gray-900 rounded-lg p-2 cursor-pointer ${selectedPlayerIds.includes(player.id) ? 'selected' : ''}`} style={{ borderColor: selectedPlayerIds.includes(player.id) ? player.color : 'transparent' }}>
                                                                <div className="player-photo-square mb-2">
                                                                    <img src={player.photoUrl} alt={player.name} onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/128x128/7F1D1D/FFFFFF?text=Error'; }} />
                                                                </div>
                                <p className="text-white text-center font-semibold truncate" style={{ color: player.color }}>{player.name}</p>
                            </div>
                            <button onClick={() => handleDeletePlayer(player.id)} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 z-10"><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>
                <div className="bg-gray-900/70 p-4 rounded-lg mb-6">
                    <h4 className="text-lg font-bold text-white mb-3 text-center">Ajouter un nouveau pigeon</h4>
                    <div className="flex flex-col md:flex-row gap-3">
                        <input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Nom du joueur" className="flex-grow bg-gray-800 text-white p-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="text" value={newPlayerPhoto} onChange={e => setNewPlayerPhoto(e.target.value)} placeholder="URL de la photo (optionnel)" className="flex-grow bg-gray-800 text-white p-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button onClick={handleAddPlayer} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2"><UserPlus size={20}/> Ajouter</button>
                    </div>
                </div>
                <button onClick={onConfirm} disabled={selectedPlayerIds.length < 4} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-press-start py-4 px-4 rounded-lg text-xl disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 flex items-center justify-center gap-3">
                    {selectedPlayerIds.length < 4 ? `(Encore ${4 - selectedPlayerIds.length} joueurs)` : "LET'S-A-GO !"} <ChevronsRight size={24}/>
                </button>
            </div>
        </div>
    );
};

interface RaceSetupProps { setNumberOfRaces: React.Dispatch<React.SetStateAction<number>>; onConfirm: () => void; }
const RaceSetup: React.FC<RaceSetupProps> = ({ setNumberOfRaces, onConfirm }) => (
    <div className="w-full max-w-md mx-auto p-8 text-center fade-in">
        <h2 className="text-3xl font-bold text-white mb-6">Nombre de courses par joueur ?</h2>
        <p className="text-gray-400 mb-8">Chaque joueur participera à ce nombre de courses. L'app s'occupe de créer des groupes équilibrés.</p>
        <input type="number" min="1" defaultValue="3" onChange={(e) => setNumberOfRaces(parseInt(e.target.value, 10))} className="w-full bg-gray-800 text-white text-center text-3xl p-4 rounded-lg border-2 border-gray-700 mb-8 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={onConfirm} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-press-start py-4 px-4 rounded-lg text-xl">Générer les courses</button>
    </div>
);

interface NextRaceInterstitialProps { race: TournamentPlayer[]; raceIndex: number; totalRaces: number; onStart: () => void; }
const NextRaceInterstitial: React.FC<NextRaceInterstitialProps> = ({ race, raceIndex, totalRaces, onStart }) => (
    <div className="w-full max-w-4xl mx-auto p-8 text-center fade-in">
        <h2 className="font-press-start text-3xl text-red-500 mb-4">Course {raceIndex + 1} / {totalRaces}</h2>
        <h3 className="text-2xl font-bold text-white mb-10">Les prochains sacrifiés sont...</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {race.map((player, i) => (
                <div key={player.id} className="text-center slide-in-bottom" style={{animationDelay: `${i * 100}ms`}}>
                    <img src={player.photoUrl} alt={player.name} className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full mx-auto border-4 border-gray-600 mb-4"/>
                    <p className="text-xl font-bold text-white">{player.name}</p>
                </div>
            ))}
        </div>
        <button onClick={onStart} className="bg-green-600 hover:bg-green-700 text-white font-press-start py-4 px-6 rounded-lg text-2xl">START !</button>
    </div>
);

interface RaceScreenProps { race: TournamentPlayer[]; raceIndex: number; totalRaces: number; onFinishRace: (ranking: TournamentPlayer[]) => void; }
const RaceScreen: React.FC<RaceScreenProps> = ({ race, raceIndex, totalRaces, onFinishRace }) => {
    const [ranking, setRanking] = useState<TournamentPlayer[]>([]);
    const handleSelectPlayer = (player: TournamentPlayer) => !ranking.find(p => p.id === player.id) && setRanking([...ranking, player]);
    return (
        <div className="w-full max-w-4xl mx-auto p-8 fade-in">
            <h2 className="font-press-start text-3xl text-center text-yellow-300 mb-6">Course {raceIndex + 1} / {totalRaces}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-800/50 p-6 rounded-xl border-2 border-gray-700">
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">Qui a joué ?</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {race.map(player => (
                            <div key={player.id} onClick={() => handleSelectPlayer(player)} className={`player-card p-2 bg-gray-900 rounded-lg cursor-pointer ${ranking.find(p => p.id === player.id) ? 'disabled' : ''}`} style={{ borderColor: ranking.find(p => p.id === player.id) ? player.color + '55' : player.color }}>
                                                                <div className="player-photo-square mb-2">
                                                                    <img src={player.photoUrl} alt={player.name} />
                                                                </div>
                                <p className="text-white text-center font-semibold truncate" style={{ color: player.color }}>{player.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl border-2 border-gray-700">
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">Classement de la course</h3>
                    <div className="space-y-3 min-h-[280px]">
                        {ranking.map((player, index) => (
                            <div key={player.id} className="flex items-center bg-gray-900 p-2 rounded-lg" style={{ borderLeft: `4px solid ${player.color}` }}>
                                <span className={`text-2xl font-bold w-10 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-yellow-600' : 'text-gray-500'}`}>{index + 1}</span>
                                <img src={player.photoUrl} alt={player.name} className="w-10 h-10 rounded-full object-cover mx-3 image-pixelated" style={{ imageRendering: 'pixelated' }}/>
                                <span className="font-semibold" style={{ color: player.color }}>{player.name}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                         <button onClick={() => setRanking([])} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">Reset</button>
                        <button onClick={() => onFinishRace(ranking)} disabled={ranking.length !== 4} className="w-full bg-red-600 hover:bg-red-700 text-white font-press-start py-3 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">Valider</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Écran de classement général après chaque course
interface OverallRankingProps { players: TournamentPlayer[]; raceIndex: number; totalRaces: number; onContinue: () => void; lastRaceWinner: TournamentPlayer | null; lastRaceLoser: TournamentPlayer | null; }
const OverallRanking: React.FC<OverallRankingProps> = ({ players, raceIndex, totalRaces, onContinue, lastRaceWinner, lastRaceLoser }) => {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
        <div className="w-full max-w-3xl mx-auto p-6 fade-in">
            <h2 className="font-press-start text-2xl md:text-3xl text-center text-yellow-300 mb-2">Classement Général</h2>
            <p className="text-center text-gray-400 mb-6">Après la course {raceIndex + 1} / {totalRaces}</p>
            <div className="bg-gray-800/60 border-2 border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-900/70">
                        <tr>
                            <th className="py-2 px-3 text-gray-300 text-sm">#</th>
                            <th className="py-2 px-3 text-gray-300 text-sm">Joueur</th>
                            <th className="py-2 px-3 text-gray-300 text-sm">Points</th>
                            <th className="py-2 px-3 text-gray-300 text-sm hidden sm:table-cell">Courses</th>
                            <th className="py-2 px-3 text-gray-300 text-sm hidden md:table-cell">Gages</th>
                            <th className="py-2 px-3 text-gray-300 text-sm hidden md:table-cell">Shots</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((p, idx) => {
                            const isWinner = lastRaceWinner && p.id === lastRaceWinner.id;
                            const isLoser = lastRaceLoser && p.id === lastRaceLoser.id;
                            return (
                                <tr key={p.id} className={`${idx % 2 ? 'bg-gray-800/40' : 'bg-gray-800/20'} ${isWinner ? 'outline outline-2 outline-green-500' : ''} ${isLoser ? 'outline outline-2 outline-red-500' : ''}`}>
                                    <td className="py-2 px-3 font-bold text-gray-400">{idx + 1}</td>
                                    <td className="py-2 px-3 flex items-center gap-3">
                                        <span className="w-3 h-10 rounded-sm" style={{ backgroundColor: p.color }} />
                                        <img src={p.photoUrl} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-gray-600" style={{ imageRendering: 'pixelated' }} />
                                        <span className={`font-semibold ${isWinner ? 'text-green-400' : isLoser ? 'text-red-400' : ''}`} style={{ color: (!isWinner && !isLoser) ? p.color : undefined }}>{p.name}</span>
                                    </td>
                                    <td className="py-2 px-3 font-bold text-white">{p.score}</td>
                                    <td className="py-2 px-3 text-gray-300 hidden sm:table-cell">{p.racesPlayed}</td>
                                    <td className="py-2 px-3 text-gray-300 hidden md:table-cell">{p.daresAccepted}</td>
                                    <td className="py-2 px-3 text-gray-300 hidden md:table-cell">{p.shotsTaken}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <div className="flex items-center gap-2 text-sm text-gray-400 justify-center"><span className="w-3 h-3 inline-block bg-green-500 rounded-sm"/> Vainqueur de la course</div>
                <div className="flex items-center gap-2 text-sm text-gray-400 justify-center"><span className="w-3 h-3 inline-block bg-red-500 rounded-sm"/> Dernier de la course</div>
            </div>
            <button onClick={onContinue} className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-press-start py-4 rounded-lg text-lg">Continuer</button>
        </div>
    );
};

interface LoserModalProps { loser: TournamentPlayer | null; winner: TournamentPlayer | null; onResolve: (payload: { mode: 'dare'; dareText: string } | { mode: 'shots'; shots: number } | { mode: 'skip' }) => void; }
const LoserModal: React.FC<LoserModalProps> = ({ loser, winner, onResolve }) => {
    const [mode, setMode] = useState<'dare' | 'shots'>('dare');
    const [dareText, setDareText] = useState('');
    const [shots, setShots] = useState<number>(1);
    if (!loser || !winner) return null;
    const valid = mode === 'dare' ? dareText.trim().length > 0 : shots > 0;
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 fade-in">
            <div className="bg-gray-900 border-4 border-red-500 rounded-2xl w-full max-w-xl p-8 text-center relative zoom-in">
                <button onClick={() => onResolve({ mode: 'skip' })} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X size={24} /></button>
                <Skull className="text-red-500 mx-auto mb-4" size={64} />
                <h2 className="text-2xl font-press-start text-red-500 mb-2">LOSER: {loser.name}</h2>
                <p className="text-lg text-white mb-4"><span className="text-green-400 font-semibold">{winner.name}</span> décide du sort du dernier.</p>
                <div className="flex justify-center gap-4 mb-6">
                    <button onClick={() => setMode('dare')} className={`px-4 py-2 rounded-md font-bold flex items-center gap-2 ${mode==='dare' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}><Dices size={20}/> Gage</button>
                    <button onClick={() => setMode('shots')} className={`px-4 py-2 rounded-md font-bold flex items-center gap-2 ${mode==='shots' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}><GlassWater size={20}/> Shots</button>
                </div>
                {mode === 'dare' && (
                    <div className="mb-6 text-left">
                      <label className="flex items-center gap-3 text-lg font-semibold text-gray-300">
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-green-500 cursor-pointer"
                          checked={!!dareText}
                          onChange={e => setDareText(e.target.checked ? 'done' : '')}
                        />
                        {loser.name} a fait le gage !
                      </label>
                      <p className="text-xs text-gray-500 mt-2">Coche cette case une fois le gage réalisé.</p>
                    </div>
                )}
                {mode === 'shots' && (
                    <div className="mb-6 text-left">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Nombre de shots que {loser.name} doit boire</label>
                        <input type="number" min={1} value={shots} onChange={e => setShots(parseInt(e.target.value,10)||1)} className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl" />
                    </div>
                )}
                <button disabled={!valid} onClick={() => mode==='dare' ? onResolve({ mode: 'dare', dareText: dareText.trim() }) : onResolve({ mode: 'shots', shots })} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-press-start py-4 rounded-lg text-lg">VALIDER</button>
            </div>
        </div>
    );
};

// ItemBoxModal supprimé

interface FinalPodiumProps { players: TournamentPlayer[]; onRestart: () => void; }
const FinalPodium: React.FC<FinalPodiumProps> = ({ players, onRestart }) => {
    const [showConfetti, setShowConfetti] = useState(false);
    useEffect(() => {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 8000);
        return () => clearTimeout(timer);
    }, []);

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const awards = useMemo(() => {
        const kingOfDares = [...players].sort((a, b) => b.daresAccepted - a.daresAccepted)[0];
        const biggestDrinker = [...players].sort((a, b) => b.shotsTaken - a.shotsTaken)[0];
        // Remontada: plus grosse amélioration (worstRank - finalRank)
        const finalSorted = [...players].sort((a, b) => b.score - a.score);
        const rankMap = new Map<number, number>();
        finalSorted.forEach((p, idx) => rankMap.set(p.id, idx + 1));
        let comebackPlayer: TournamentPlayer | null = null;
        let bestImprovement = 0;
        players.forEach(p => {
            const finalRank = rankMap.get(p.id)!;
            const improvement = p.worstRank - finalRank; // positif => a remonté
            if (improvement > bestImprovement && p.worstRank > 0) {
                bestImprovement = improvement;
                comebackPlayer = p;
            }
        });
        if (!comebackPlayer) comebackPlayer = finalSorted[0]; // fallback
        return [
            { title: "Roi du Gage", player: kingOfDares, icon: <Dices className="text-green-400"/>, gif: kingOfDaresGif },
            { title: "Plus Gros Buveur", player: biggestDrinker, icon: <GlassWater className="text-purple-400"/>, gif: biggestDrinkerGif },
            { title: "Remontada", player: comebackPlayer, icon: <TrendingUp className="text-orange-400"/>, gif: bulletBillGif },
        ];
    }, [players]);

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 fade-in">
            <SimpleConfetti isActive={showConfetti} />
            <h1 className="font-press-start text-4xl md:text-5xl text-yellow-300 mb-4">VAINQUEUR !</h1>
            <div className="flex items-center justify-center mb-4">
                <img src={sortedPlayers[0].photoUrl} alt={sortedPlayers[0].name} className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400"/>
                <p className="text-4xl font-bold text-white ml-4">{sortedPlayers[0].name}</p>
            </div>

            <div className="flex items-end justify-center w-full max-w-2xl gap-2 mb-12">
                <div className="w-1/3 text-center podium-step">
                    <div className="flex flex-col items-center"><img src={sortedPlayers[1].photoUrl} alt={sortedPlayers[1].name} className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 mb-2"/><p className="font-bold text-lg text-white">{sortedPlayers[1].name}</p><p className="text-gray-300 text-lg">{sortedPlayers[1].score} pts</p></div>
                    <div className="h-48 rounded-t-lg podium-base flex items-center justify-center text-5xl font-press-start text-gray-300" style={{backgroundColor: '#C0C0C0'}}>2</div>
                </div>
                <div className="w-1/3 text-center podium-step">
                     <div className="flex flex-col items-center"><Crown size={48} className="text-yellow-400 mb-2"/><img src={sortedPlayers[0].photoUrl} alt={sortedPlayers[0].name} className="w-32 h-32 rounded-full object-cover border-4 border-yellow-400 mb-2"/><p className="font-bold text-xl text-white">{sortedPlayers[0].name}</p><p className="text-yellow-400 text-xl">{sortedPlayers[0].score} pts</p></div>
                    <div className="h-64 rounded-t-lg podium-base flex items-center justify-center text-6xl font-press-start text-yellow-400" style={{backgroundColor: '#FFD700'}}>1</div>
                </div>
                <div className="w-1/3 text-center podium-step">
                     <div className="flex flex-col items-center"><img src={sortedPlayers[2].photoUrl} alt={sortedPlayers[2].name} className="w-24 h-24 rounded-full object-cover border-4 border-yellow-600 mb-2"/><p className="font-bold text-lg text-white">{sortedPlayers[2].name}</p><p className="text-yellow-600 text-lg">{sortedPlayers[2].score} pts</p></div>
                    <div className="h-32 rounded-t-lg podium-base flex items-center justify-center text-5xl font-press-start text-yellow-600" style={{backgroundColor: '#CD7F32'}}>3</div>
                </div>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-1">
                    <h3 className="text-2xl font-bold text-center text-gray-400 mb-4">Panthéon de la Lose</h3>
                    <div className="bg-gray-800/50 p-4 rounded-xl space-y-2">
                        {sortedPlayers.slice(3).map((player, index) => (
                            <div key={player.id} className="flex items-center justify-between bg-gray-900 p-2 rounded-lg">
                                <div className="flex items-center"><span className="font-bold text-gray-500 w-8">{index + 4}.</span><img src={player.photoUrl} alt={player.name} className="w-10 h-10 rounded-full object-cover mx-3"/><span className="text-white">{player.name}</span></div>
                                <span className="text-gray-400 font-bold">{player.score} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold text-center text-gray-400 mb-4">Titres Honorifiques</h3>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {awards.map(award => (
                            <div key={award.title} className="bg-gray-800/50 p-4 rounded-xl text-center">
                                <div className="flex items-center justify-center gap-2 mb-2"><Trophy size={24} className="text-yellow-400"/> <h4 className="text-xl font-bold text-white">{award.title}</h4></div>
                                <img src={award.gif} alt={award.title} className="w-full h-32 object-cover rounded-lg mb-3"/>
                                <div className="flex items-center justify-center gap-3">
                                    <img src={award.player.photoUrl} alt={award.player.name} className="w-12 h-12 rounded-full border-2 border-gray-500"/>
                                    <p className="text-lg font-semibold text-white">{award.player.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button onClick={onRestart} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-press-start py-4 px-8 rounded-lg text-xl">Recommencer une partie</button>
        </div>
    );
};


// COMPOSANT PRINCIPAL
type View = 'playerSetup' | 'raceSetup' | 'nextRace' | 'race' | 'overallRanking' | 'loser' | 'finalPodium';
export default function App() {
    const [view, setView] = useState<View>('playerSetup'); // playerSetup, raceSetup, nextRace, race, loser, itemBox, finalPodium
    const [allPlayers, setAllPlayers] = useLocalStorageState<Player[]>('mk-players', INITIAL_PLAYERS);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayer[]>([]);
  const [numberOfRaces, setNumberOfRaces] = useState(3);
  const [races, setRaces] = useState<Race[]>([]);
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
  const [loser, setLoser] = useState<TournamentPlayer | null>(null);
    const [lastWinner, setLastWinner] = useState<TournamentPlayer | null>(null);
    // activeItemEvent supprimé

  const resetTournament = () => {
    setView('playerSetup');
    setSelectedPlayerIds([]);
    setTournamentPlayers([]);
    setRaces([]);
    setCurrentRaceIndex(0);
    setLoser(null);
    // activeItemEvent nettoyé
  };

  const handlePlayerSetupConfirm = () => {
      const selected = allPlayers
          .filter(p => selectedPlayerIds.includes(p.id))
          .map((p, idx) => ({
              ...p,
              color: p.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
              score: 0,
              racesPlayed: 0,
              daresAccepted: 0,
              shotsTaken: 0,
              worstRank: 0
          }));
      setTournamentPlayers(selected);
      setView('raceSetup');
  };

  const handleRaceSetupConfirm = () => {
    let tempPlayers = [...tournamentPlayers];
    let generatedRaces: Race[] = [];
    let attempts = 0;
    while (tempPlayers.some(p => p.racesPlayed < numberOfRaces) && attempts < 1000) {
        tempPlayers.sort((a, b) => a.racesPlayed - b.racesPlayed);
        let race: TournamentPlayer[] = [];
        let availablePlayers = tempPlayers.filter(p => p.racesPlayed < numberOfRaces);
        let playersToPickFrom = availablePlayers.slice(0, 8);
        playersToPickFrom.sort(() => 0.5 - Math.random());
        while (race.length < 4 && playersToPickFrom.length > 0) {
            race.push(playersToPickFrom.shift()!);
        }
        if (race.length === 4) {
            generatedRaces.push(race);
            race.forEach(pInRace => {
                const playerIndex = tempPlayers.findIndex(p => p.id === pInRace.id);
                if(playerIndex !== -1) tempPlayers[playerIndex].racesPlayed++;
            });
        }
        attempts++;
    }
    setRaces(generatedRaces);
    setTournamentPlayers(tempPlayers);
    setView('nextRace');
  };

  const handleFinishRace = (ranking: TournamentPlayer[]) => {
    const points = [10, 6, 3, 1];
    setTournamentPlayers(prev => {
        const updatedPlayers = [...prev];
        ranking.forEach((rankedPlayer, index) => {
            const playerIndex = updatedPlayers.findIndex(p => p.id === rankedPlayer.id);
            if (playerIndex !== -1) updatedPlayers[playerIndex].score += points[index];
        });
        const sortedNow = [...updatedPlayers].sort((a, b) => b.score - a.score);
        sortedNow.forEach((p, idx) => {
            const playerIndex = updatedPlayers.findIndex(pl => pl.id === p.id);
            if (playerIndex !== -1) {
                const currentRank = idx + 1;
                if (updatedPlayers[playerIndex].worstRank < currentRank) {
                    updatedPlayers[playerIndex].worstRank = currentRank;
                }
            }
        });
        // Set winner/loser after points
        setLastWinner(ranking[0]);
        setLoser(ranking[3]);
        // switch to overall ranking view
        setView('overallRanking');
        return updatedPlayers;
    });
  };

    const handleCloseLoserModal = (payload: { mode: 'dare'; dareText: string } | { mode: 'shots'; shots: number } | { mode: 'skip' }) => {
      if (loser && payload.mode !== 'skip') {
          setTournamentPlayers(prev => prev.map(p => {
              if (p.id !== loser.id) return p;
              if (payload.mode === 'dare') return { ...p, daresAccepted: p.daresAccepted + 1 };
              if (payload.mode === 'shots') return { ...p, shotsTaken: p.shotsTaken + payload.shots };
              return p;
          }));
      }
      setLoser(null);
      setLastWinner(null);
      // Passage direct à l'étape suivante (ItemBox retiré)
      proceedToNextStep();
    };

  // handleCloseItemBoxModal supprimé

  const proceedToNextStep = () => {
       if (currentRaceIndex < races.length - 1) {
          setCurrentRaceIndex(prev => prev + 1);
          setView('nextRace');
      } else {
          setView('finalPodium');
      }
  }

    const renderView = () => {
    switch (view) {
        case 'playerSetup': return <PlayerSetup allPlayers={allPlayers} setAllPlayers={setAllPlayers} selectedPlayerIds={selectedPlayerIds} setSelectedPlayerIds={setSelectedPlayerIds} onConfirm={handlePlayerSetupConfirm} />;
        case 'raceSetup': return <RaceSetup setNumberOfRaces={setNumberOfRaces} onConfirm={handleRaceSetupConfirm} />;
        case 'nextRace': return <NextRaceInterstitial race={races[currentRaceIndex]} raceIndex={currentRaceIndex} totalRaces={races.length} onStart={() => setView('race')} />;
        case 'race': return <RaceScreen race={races[currentRaceIndex]} raceIndex={currentRaceIndex} totalRaces={races.length} onFinishRace={handleFinishRace} />;
        case 'overallRanking': return <OverallRanking players={tournamentPlayers} raceIndex={currentRaceIndex} totalRaces={races.length} lastRaceWinner={lastWinner} lastRaceLoser={loser} onContinue={() => setView('loser')} />;
    case 'loser': return <LoserModal loser={loser} winner={lastWinner} onResolve={handleCloseLoserModal} />;
        case 'finalPodium': return <FinalPodium players={tournamentPlayers} onRestart={resetTournament} />;
        default: return <div>Erreur</div>;
    }
  };

  return (
    <>
        <style>{styles}</style>
        <div className="bg-gray-900 min-h-screen w-full flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
            {renderView()}
        </div>
    </>
  );
}
