import React, { useState } from "react";
import avatarImg from "./assets/avatar.png";
import shotImg from "./assets/shot.png";
import fireworksImg from "./assets/fireworks.png";

// Types
type Player = {
  id: string;
  name: string;
  avatar?: string;
};

type Race = string[]; // array of player ids participating

type Schedule = Race[];

// Stats for fun features: shots taken and dares accepted
interface PlayerStats {
  shotsTaken: number;
  acceptedDares: number;
}

// Dare definition
interface Dare {
  text: string;
  difficulty: "easy" | "medium" | "hard";
}

// Item event definition
interface ItemEvent {
  key: string;
  name: string;
  description: string;
}

// Predefined players list for quick selection
const PREDEFINED_PLAYERS: Player[] = [
  { id: "p1", name: "Luigi", avatar: avatarImg },
  { id: "p2", name: "Peach", avatar: avatarImg },
  { id: "p3", name: "Yoshi", avatar: avatarImg },
  { id: "p4", name: "Toad", avatar: avatarImg },
  { id: "p5", name: "Bowser", avatar: avatarImg },
  { id: "p6", name: "Wario", avatar: avatarImg },
];

// Dare suggestions with difficulty
const DARES: Dare[] = [
  { text: "Chante une chanson Disney devant tout le monde 🎤", difficulty: "easy" },
  { text: "Raconte ta pire blague (humour noir bienvenu) 😈", difficulty: "easy" },
  { text: "Publie une story gênante sur Insta 📸", difficulty: "medium" },
  { text: "Réalise 20 pompes devant tes potes 💪", difficulty: "medium" },
  { text: "Bois un shot sans les mains 🍺", difficulty: "hard" },
  { text: "Envoie un texto ambigu à ton/ta partenaire 📱", difficulty: "hard" },
];

// Map difficulty to number of shots if player refuses the dare
const SHOTS_PER_DIFFICULTY: Record<Dare["difficulty"], number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

// Item events definitions
const ITEM_EVENTS: ItemEvent[] = [
  {
    key: "blue_shell",
    name: "Carapace Bleue 🐢",
    description: "Le premier du classement général boit un shot pour calmer ses ardeurs.",
  },
  {
    key: "lightning",
    name: "Éclair ⚡️",
    description: "Tout le monde boit un shot, sauf le dernier du classement général qui est épargné par la foudre.",
  },
  {
    key: "golden_mushroom",
    name: "Champignon Doré 🍄",
    description: "Le joueur de votre choix (sauf vous) gagne 3 points bonus.",
  },
];

// Helper to shuffle an array (Fisher–Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Compute schedule of races such that each player appears approximately the same number of times and races have up to 4 players
function makeSchedule(players: Player[], appearances: number): Schedule {
  // Create an array with each player's id repeated 'appearances' times
  const pool: string[] = [];
  players.forEach((p) => {
    for (let i = 0; i < appearances; i++) {
      pool.push(p.id);
    }
  });
  const shuffled = shuffleArray(pool);
  const races: Schedule = [];
  while (shuffled.length > 0) {
    // Take up to 4 players per race
    const race: string[] = [];
    while (race.length < 4 && shuffled.length > 0) {
      const candidate = shuffled.shift()!;
      // Avoid duplicates in same race
      if (!race.includes(candidate)) {
        race.push(candidate);
      } else {
        // Put back at the end to try later
        shuffled.push(candidate);
      }
      // To avoid infinite loops if there are duplicates
      if (race.length === 4) break;
    }
    races.push(race);
  }
  return races;
}

// Utility to rank players by score descending
function sortPlayersByScore(scores: Record<string, number>, players: Player[]): string[] {
  return [...players]
    .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
    .map((p) => p.id);
}

// PlayerInput component handles adding players (predefined or custom)
interface PlayerInputProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
}

const PlayerInput: React.FC<PlayerInputProps> = ({ players, setPlayers }) => {
  const [name, setName] = useState("");

  const addPlayer = (player: Player) => {
    if (players.find((p) => p.id === player.id) || players.find((p) => p.name === player.name)) {
      return;
    }
    setPlayers([...players, player]);
  };

  const handleAddCustom = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newPlayer: Player = { id: `custom-${Date.now()}`, name: trimmed };
    setPlayers([...players, newPlayer]);
    setName("");
  };

  const handleRemove = (id: string) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  return (
    <div className="player-input">
      <h2>Participants</h2>
      <div className="predefined">
        {PREDEFINED_PLAYERS.map((p) => (
          <button
            key={p.id}
            onClick={() => addPlayer(p)}
            disabled={players.some((pl) => pl.id === p.id)}
            style={{ margin: 4, padding: "4px 8px" }}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <input
          type="text"
          value={name}
          placeholder="Ajouter un joueur"
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={handleAddCustom}>Ajouter</button>
      </div>
      {players.length > 0 && (
        <ul style={{ marginTop: 8 }}>
          {players.map((p) => (
            <li key={p.id} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              {p.avatar && (
                <img src={p.avatar} alt="" style={{ width: 24, height: 24, borderRadius: "50%", marginRight: 8 }} />
              )}
              {p.name}
              <button onClick={() => handleRemove(p.id)} style={{ marginLeft: 8 }}>
                ✖
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ScheduleSetup component chooses number of races each player will play
interface ScheduleSetupProps {
  appearances: number;
  setAppearances: (num: number) => void;
  startSchedule: () => void;
}

const ScheduleSetup: React.FC<ScheduleSetupProps> = ({ appearances, setAppearances, startSchedule }) => {
  return (
    <div className="schedule-setup" style={{ marginTop: 16 }}>
      <h2>Combien de fois chaque joueur joue-t-il ?</h2>
      <input
        type="number"
        min={1}
        value={appearances}
        onChange={(e) => setAppearances(parseInt(e.target.value, 10))}
        style={{ marginRight: 8 }}
      />
      <button onClick={startSchedule}>Créer le planning</button>
    </div>
  );
};

// RaceResultInput allows entering ranking for the current race
interface RaceResultInputProps {
  racePlayers: Player[];
  onSubmit: (orderedIds: string[]) => void;
}

const RaceResultInput: React.FC<RaceResultInputProps> = ({ racePlayers, onSubmit }) => {
  const [order, setOrder] = useState<string[]>(() => racePlayers.map((p) => p.id));

  // Drag and drop reorder functions or simple reorder with up/down buttons could be added for more fun
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrder(newOrder);
  };
  const moveDown = (index: number) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrder(newOrder);
  };

  return (
    <div className="race-result-input">
      <h3>Classement de la course</h3>
      <ul>
        {order.map((pid, idx) => {
          const player = racePlayers.find((p) => p.id === pid)!;
          return (
            <li key={pid} style={{ marginBottom: 4 }}>
              {idx + 1}. {player.name}{" "}
              <button onClick={() => moveUp(idx)} disabled={idx === 0}>
                🔼
              </button>{" "}
              <button onClick={() => moveDown(idx)} disabled={idx === order.length - 1}>
                🔽
              </button>
            </li>
          );
        })}
      </ul>
      <button onClick={() => onSubmit(order)}>Valider le classement</button>
    </div>
  );
};

// NextRaceAnnouncement displays who plays next
interface NextRaceAnnouncementProps {
  nextPlayers: Player[];
  onContinue: () => void;
}

const NextRaceAnnouncement: React.FC<NextRaceAnnouncementProps> = ({ nextPlayers, onContinue }) => {
  return (
    <div className="next-race-announcement" style={{ textAlign: "center", padding: 20 }}>
      <h2>Prochaine course !</h2>
      <p>Les pilotes :</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {nextPlayers.map((p) => (
          <li key={p.id} style={{ margin: 8, fontSize: 24 }}>
            {p.name}
          </li>
        ))}
      </ul>
      <button onClick={onContinue}>C'est parti !</button>
    </div>
  );
};

// ItemBoxModal shows random event after a race
interface ItemBoxModalProps {
  event: ItemEvent;
  players: Player[];
  scores: Record<string, number>;
  onClose: (selectedPlayerId?: string) => void;
}

const ItemBoxModal: React.FC<ItemBoxModalProps> = ({ event, players, scores, onClose }) => {
  const [chosen, setChosen] = useState<string | undefined>();

  const handleContinue = () => {
    if (event.key === "golden_mushroom") {
      if (!chosen) return;
      onClose(chosen);
    } else {
      onClose();
    }
  };

  // For golden mushroom event, let the user pick a recipient
  let selectionUI = null;
  if (event.key === "golden_mushroom") {
    selectionUI = (
      <div style={{ marginTop: 12 }}>
        <p>Choisissez un joueur (sauf vous) pour lui offrir 3 points bonus :</p>
        <select value={chosen} onChange={(e) => setChosen(e.target.value)}>
          <option value="">-- Sélectionnez --</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="modal" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 8, maxWidth: 400, textAlign: "center" }}>
        <h3>{event.name}</h3>
        <p>{event.description}</p>
        {selectionUI}
        <button style={{ marginTop: 12 }} onClick={handleContinue}>
          Continuer
        </button>
      </div>
    </div>
  );
};

// DareOrShotsModal component: loser chooses between dare or shots
interface DareOrShotsModalProps {
  loser: Player;
  dare: Dare;
  onChooseDare: () => void;
  onChooseShots: (shots: number) => void;
}

const DareOrShotsModal: React.FC<DareOrShotsModalProps> = ({ loser, dare, onChooseDare, onChooseShots }) => {
  const shots = SHOTS_PER_DIFFICULTY[dare.difficulty];
  return (
    <div className="modal" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 8, maxWidth: 420, textAlign: "center" }}>
        <h3>{loser.name}, tu as perdu !</h3>
        <p>{dare.text}</p>
        <p><strong>Acceptes-tu le gage</strong> ou préfères-tu <strong>{shots} shot{shots > 1 ? "s" : ""}</strong> ?</p>
        <div style={{ marginTop: 12 }}>
          <button onClick={onChooseDare} style={{ marginRight: 8 }}>
            J'accepte le gage
          </button>
          <button onClick={() => onChooseShots(shots)}>
            Je bois {shots} shot{shots > 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
};

// FinalStandings shows podium and final rankings along with titles
interface FinalStandingsProps {
  players: Player[];
  scores: Record<string, number>;
  stats: Record<string, PlayerStats>;
  rankHistory: string[][];
}

const FinalStandings: React.FC<FinalStandingsProps> = ({ players, scores, stats, rankHistory }) => {
  const orderedIds = sortPlayersByScore(scores, players);

  // Compute titles
  // Roi du Gage: max accepted dares
  let roiDuGage = "";
  let maxDares = -1;
  for (const pid of orderedIds) {
    const dares = stats[pid]?.acceptedDares ?? 0;
    if (dares > maxDares) {
      maxDares = dares;
      roiDuGage = pid;
    }
  }
  // Plus Gros Buveur: max shots taken
  let grosBuveur = "";
  let maxShots = -1;
  for (const pid of orderedIds) {
    const shots = stats[pid]?.shotsTaken ?? 0;
    if (shots > maxShots) {
      maxShots = shots;
      grosBuveur = pid;
    }
  }
  // La Remontada: largest improvement between last two rankings
  let remontada = "";
  let bestGain = -Infinity;
  if (rankHistory.length >= 2) {
    const prevRank = rankHistory[rankHistory.length - 2];
    const finalRank = rankHistory[rankHistory.length - 1];
    players.forEach((p) => {
      const prevPos = prevRank.indexOf(p.id);
      const finalPos = finalRank.indexOf(p.id);
      const gain = prevPos - finalPos; // positive gain means moved up
      if (gain > bestGain) {
        bestGain = gain;
        remontada = p.id;
      }
    });
  }

  return (
    <div className="final-standings" style={{ textAlign: "center", position: "relative" }}>
      {/* fireworks background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${fireworksImg})`, backgroundSize: "cover", opacity: 0.3 }}></div>
      <h2>Classement Final</h2>
      {/* Podium */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", marginTop: 24 }}>
        {orderedIds.slice(0, 3).map((pid, idx) => {
          const player = players.find((p) => p.id === pid)!;
          const height = [120, 160, 100][idx]; // second, first, third heights? we choose ascending? Actually order is first index 0 is top; we want first bigger than second bigger than third. We'll map [second = 120, first = 160, third = 100].
          return (
            <div key={pid} style={{ margin: "0 12px", textAlign: "center" }}>
              <div style={{ background: "#e0e0e0", width: 60, height: height, borderRadius: 4, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <span style={{ paddingBottom: 4, fontWeight: "bold" }}>{idx + 1}</span>
              </div>
              <div style={{ marginTop: 4 }}>
                {player.name}
              </div>
            </div>
          );
        })}
      </div>
      {/* Full list */}
      <div style={{ marginTop: 32 }}>
        <h3>Classement complet :</h3>
        <ol style={{ textAlign: "left", display: "inline-block" }}>
          {orderedIds.map((pid, idx) => {
            const player = players.find((p) => p.id === pid)!;
            return (
              <li key={pid}>
                {player.name} — {scores[pid]} points
              </li>
            );
          })}
        </ol>
      </div>
      {/* Titles */}
      <div style={{ marginTop: 32 }}>
        <h3>Titres et Succès :</h3>
        <ul style={{ textAlign: "left", display: "inline-block" }}>
          {roiDuGage && <li>Roi du Gage : {players.find((p) => p.id === roiDuGage)!.name}</li>}
          {grosBuveur && <li>Plus Gros Buveur : {players.find((p) => p.id === grosBuveur)!.name}</li>}
          {remontada && bestGain > 0 && <li>La Remontada : {players.find((p) => p.id === remontada)!.name} (+{bestGain})</li>}
        </ul>
      </div>
    </div>
  );
};

// Main App component controlling the game flow
const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [appearances, setAppearances] = useState(2);
  const [schedule, setSchedule] = useState<Schedule>([]);
  const [currentRaceIdx, setCurrentRaceIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [raceResults, setRaceResults] = useState<Record<number, string[]>>({});
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({});
  const [rankHistory, setRankHistory] = useState<string[][]>([]);

  // Modal & intermediate states
  const [loserId, setLoserId] = useState<string | null>(null);
  const [currentDare, setCurrentDare] = useState<Dare | null>(null);
  const [showDareModal, setShowDareModal] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItemEvent, setCurrentItemEvent] = useState<ItemEvent | null>(null);

  const [isAnnouncingNextRace, setIsAnnouncingNextRace] = useState(false);

  // Start schedule creation
  const startSchedule = () => {
    if (players.length < 4) {
      alert("Il faut au moins 4 joueurs !");
      return;
    }
    const sched = makeSchedule(players, appearances);
    setSchedule(sched);
    // initialize scores and stats
    const initScores: Record<string, number> = {};
    const initStats: Record<string, PlayerStats> = {};
    players.forEach((p) => {
      initScores[p.id] = 0;
      initStats[p.id] = { shotsTaken: 0, acceptedDares: 0 };
    });
    setScores(initScores);
    setPlayerStats(initStats);
    // start first race
    setCurrentRaceIdx(0);
    setRankHistory([]);
  };

  // When race results are submitted
  const handleRaceSubmit = (orderedIds: string[]) => {
    // Save results
    const raceIndex = currentRaceIdx;
    setRaceResults({ ...raceResults, [raceIndex]: orderedIds });

    // Determine points distribution: 1st=3 pts, 2nd=2, 3rd=1, 4th=0
    const pointsForPlace = [3, 2, 1, 0];
    const updatedScores = { ...scores };
    orderedIds.forEach((pid, idx) => {
      updatedScores[pid] = (updatedScores[pid] || 0) + pointsForPlace[idx];
    });

    // Update ranking history (after updating scores)
    const updatedRank = sortPlayersByScore(updatedScores, players);
    setRankHistory((prev) => [...prev, updatedRank]);

    setScores(updatedScores);

    // Determine loser (last in race)
    const lastPlayerId = orderedIds[orderedIds.length - 1];
    // random dare
    const randomDare = DARES[Math.floor(Math.random() * DARES.length)];
    setLoserId(lastPlayerId);
    setCurrentDare(randomDare);
    setShowDareModal(true);
  };

  // After dare or shots decision
  const resolveDareDecision = (accepted: boolean, shots?: number) => {
    if (!loserId || !currentDare) return;
    const updatedStats = { ...playerStats };
    const stats = updatedStats[loserId];
    if (accepted) {
      stats.acceptedDares += 1;
    } else {
      const numShots = shots ?? SHOTS_PER_DIFFICULTY[currentDare.difficulty];
      stats.shotsTaken += numShots;
    }
    setPlayerStats(updatedStats);
    // Close dare modal
    setShowDareModal(false);
    // After dare, if not last race then maybe show item box
    if (currentRaceIdx < schedule.length - 1) {
      // Random chance to show item: 70% chance maybe
      const showItem = true; // always show for fun; could randomize
      if (showItem) {
        const event = ITEM_EVENTS[Math.floor(Math.random() * ITEM_EVENTS.length)];
        setCurrentItemEvent(event);
        setShowItemModal(true);
        return;
      }
    }
    // Otherwise, directly announce next race or finish
    proceedToNextStepAfterModals();
  };

  // Apply item effect and continue
  const handleCloseItemModal = (selectedPlayerId?: string) => {
    if (!currentItemEvent) {
      return proceedToNextStepAfterModals();
    }
    let updatedScores = { ...scores };
    let updatedStats = { ...playerStats };
    const overallRanking = sortPlayersByScore(updatedScores, players);
    switch (currentItemEvent.key) {
      case "blue_shell":
        // First in overall ranking drinks a shot
        if (overallRanking.length > 0) {
          const first = overallRanking[0];
          updatedStats[first].shotsTaken += 1;
        }
        break;
      case "lightning":
        // Everyone drinks except last
        if (overallRanking.length > 0) {
          const last = overallRanking[overallRanking.length - 1];
          overallRanking.forEach((pid) => {
            if (pid !== last) {
              updatedStats[pid].shotsTaken += 1;
            }
          });
        }
        break;
      case "golden_mushroom":
        // Selected player gets +3 points
        if (selectedPlayerId) {
          updatedScores[selectedPlayerId] = (updatedScores[selectedPlayerId] || 0) + 3;
        }
        break;
    }
    // Update scores and stats
    setScores(updatedScores);
    setPlayerStats(updatedStats);
    // Update ranking history after event if it modifies scores
    if (currentItemEvent.key === "golden_mushroom") {
      const newRanking = sortPlayersByScore(updatedScores, players);
      setRankHistory((prev) => {
        // Replace last ranking (since it belonged to last race) with updated ranking
        const copy = [...prev];
        copy[copy.length - 1] = newRanking;
        return copy;
      });
    }
    // Close item modal
    setShowItemModal(false);
    setCurrentItemEvent(null);
    // Continue flow: either announce next race or finish
    proceedToNextStepAfterModals();
  };

  // After modals (dare and item) we either announce next race or finish
  const proceedToNextStepAfterModals = () => {
    // If there are more races, announce next race
    if (currentRaceIdx < schedule.length - 1) {
      setIsAnnouncingNextRace(true);
    } else {
      // No more races, move to finished
      setCurrentRaceIdx(schedule.length); // mark finish
    }
  };

  // Called after next race announcement
  const handleContinueAfterAnnouncement = () => {
    // Move to next race
    setIsAnnouncingNextRace(false);
    setCurrentRaceIdx((idx) => idx + 1);
  };

  // Determine current phase
  let content = null;
  if (schedule.length === 0) {
    // Phase 1: input players & setup
    content = (
      <div>
        <h1>Tournoi Mario Kart</h1>
        <PlayerInput players={players} setPlayers={setPlayers} />
        {players.length >= 4 && (
          <ScheduleSetup appearances={appearances} setAppearances={setAppearances} startSchedule={startSchedule} />
        )}
      </div>
    );
  } else if (currentRaceIdx < schedule.length) {
    // During races
    if (isAnnouncingNextRace) {
      const nextPlayersIds = schedule[currentRaceIdx + 1] || [];
      const nextPlayers = players.filter((p) => nextPlayersIds.includes(p.id));
      content = <NextRaceAnnouncement nextPlayers={nextPlayers} onContinue={handleContinueAfterAnnouncement} />;
    } else {
      const racePlayerIds = schedule[currentRaceIdx];
      const racePlayers = players.filter((p) => racePlayerIds.includes(p.id));
      content = (
        <div>
          <h2>Course {currentRaceIdx + 1}/{schedule.length}</h2>
          <RaceResultInput racePlayers={racePlayers} onSubmit={handleRaceSubmit} />
          <div style={{ marginTop: 16 }}>
            <h3>Scores</h3>
            <ul>
              {players.map((p) => (
                <li key={p.id}>
                  {p.name}: {scores[p.id] ?? 0} points (👑 Gages: {playerStats[p.id]?.acceptedDares ?? 0}, 🍺 Shots: {playerStats[p.id]?.shotsTaken ?? 0})
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
  } else {
    // Finished: show final standings
    content = <FinalStandings players={players} scores={scores} stats={playerStats} rankHistory={rankHistory} />;
  }

  return (
    <div className="app" style={{ padding: 20 }}>
      {content}
      {/* Dare or shots modal */}
      {showDareModal && loserId && currentDare && (
        <DareOrShotsModal
          loser={players.find((p) => p.id === loserId)!}
          dare={currentDare}
          onChooseDare={() => resolveDareDecision(true)}
          onChooseShots={(n) => resolveDareDecision(false, n)}
        />
      )}
      {/* Item box modal */}
      {showItemModal && currentItemEvent && (
        <ItemBoxModal
          event={currentItemEvent}
          players={players}
          scores={scores}
          onClose={handleCloseItemModal}
        />
      )}
    </div>
  );
};

export default App;
