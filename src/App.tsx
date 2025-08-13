import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dices, Trophy, Users, Play, ListOrdered, Repeat, Shuffle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Constants
const POINTS = [5, 3, 2, 0]; // Points for 1st, 2nd, 3rd, 4th
const MIN_PLAYERS = 4;

type Player = string;
type Race = Player[];
type Schedule = Race[];
type Scores = Record<Player, number>;
type GamePhase = 'setup' | 'scheduling' | 'racing' | 'finished';

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Helper function to generate schedule (adapted from Python script)
function makeSchedule(players: Player[], appearances: number): Schedule {
    const counts: Record<Player, number> = Object.fromEntries(players.map(p => [p, 0]));
    const totalRaces = (players.length * appearances) / 4;
    const schedule: Schedule = [];

    let attempts = 0;
    const maxAttempts = totalRaces * players.length * 2; // Safety break

    while (schedule.length < totalRaces && attempts < maxAttempts) {
        attempts++;
        let race: Race = [];
        // Prefer players with the fewest runs so far, with randomization
        const pool = players.sort((a, b) => {
            const countDiff = counts[a] - counts[b];
            return countDiff !== 0 ? countDiff : Math.random() - 0.5;
        });

        for (const p of pool) {
            if (counts[p] < appearances && race.length < 4 && !race.includes(p)) {
                race.push(p);
            }
        }

        // If we couldn't form a full race, try again with a shuffle
        if (race.length < 4) {
            // Backtrack slightly? Or just retry? Let's retry simply first.
            // A more robust algorithm might be needed for edge cases.
            // For now, we'll rely on valid inputs ensuring possibility.
            // Let's try filling the rest with available players
            const remainingPlayers = pool.filter(p => counts[p] < appearances && !race.includes(p));
            while(race.length < 4 && remainingPlayers.length > 0) {
                race.push(remainingPlayers.shift()!);
            }

            // If still not 4, something is wrong or it's a very tricky combination
            if (race.length < 4) {
                 console.warn(`Could not form full race ${schedule.length + 1}. Retrying. Race so far: ${race.join(', ')}`);
                 // Reset counts for this partial race attempt? No, the Python version didn't seem to backtrack.
                 // Let's just hope the next iteration works better.
                 continue; // Skip adding this partial race and try again
            }
        }

        // Increment counts for the selected players
        race.forEach(p => counts[p]++);
        schedule.push(shuffleArray(race)); // Shuffle players within the race
    }

    if (schedule.length < totalRaces) {
        console.error("Failed to generate a complete schedule. Check player count and races per player.", {players, appearances, counts, schedule});
        // Handle this error more gracefully in the UI
        throw new Error("Could not generate a complete schedule. Please try different settings.");
    }

    return schedule;
}

// Helper function to find nearest valid appearance counts
function getValidAppearances(nPlayers: number): number[] {
    const validCounts: number[] = [];
    for (let i = 1; i <= 12; i++) { // Check up to 12 races per player, reasonable limit
        if ((nPlayers * i) % 4 === 0) {
            validCounts.push(i);
        }
    }
    return validCounts;
}

// --- Components --- //

interface PlayerInputProps {
    players: Player[];
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

function PlayerInput({ players, setPlayers }: PlayerInputProps) {
    const addPlayer = () => {
        setPlayers([...players, '']);
    };

    const updatePlayer = (index: number, name: string) => {
        const newPlayers = [...players];
        newPlayers[index] = name.trim();
        setPlayers(newPlayers);
    };

    const removePlayer = (index: number) => {
        const newPlayers = players.filter((_, i) => i !== index);
        setPlayers(newPlayers);
    };

    const uniquePlayers = players.filter(p => p !== '');
    const hasDuplicates = new Set(uniquePlayers).size !== uniquePlayers.length;

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-2" /> Players</CardTitle>
                <CardDescription>Enter at least {MIN_PLAYERS} unique player names.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {players.map((player, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <Input
                            placeholder={`Player ${index + 1}`}
                            value={player}
                            onChange={(e) => updatePlayer(index, e.target.value)}
                            className={player !== '' && players.filter((p, i) => p === player && i !== index).length > 0 ? 'border-red-500' : ''}
                        />
                        {players.length > MIN_PLAYERS && (
                            <Button variant="ghost" size="icon" onClick={() => removePlayer(index)} aria-label="Remove player">
                                <span className="text-red-500">×</span>
                            </Button>
                        )}
                    </div>
                ))}
                {hasDuplicates && <p className="text-sm text-red-500">Duplicate names are not allowed.</p>}
            </CardContent>
            <CardFooter>
                <Button onClick={addPlayer} variant="outline" className="w-full">
                    Add Player
                </Button>
            </CardFooter>
        </Card>
    );
}

interface ScheduleSetupProps {
    players: Player[];
    onScheduleReady: (schedule: Schedule, racesPerPlayer: number) => void;
}

function ScheduleSetup({ players, onScheduleReady }: ScheduleSetupProps) {
    const [selectedAppearances, setSelectedAppearances] = useState<string>('');
    const [validOptions, setValidOptions] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const options = getValidAppearances(players.length);
        setValidOptions(options);
        // Reset selection if player count changes and makes previous selection invalid
        if (selectedAppearances && !options.includes(parseInt(selectedAppearances))) {
            setSelectedAppearances('');
        }
        // Auto-select if only one option
        // else if (options.length === 1) {
        //     setSelectedAppearances(options[0].toString());
        // }
    }, [players.length, selectedAppearances]);

    const handleGenerateSchedule = () => {
        setError(null);
        if (!selectedAppearances) {
            setError("Please select the number of races per player.");
            return;
        }
        try {
            const appearances = parseInt(selectedAppearances);
            const schedule = makeSchedule(players, appearances);
            onScheduleReady(schedule, appearances);
        } catch (err: any) {
            setError(err.message || "Failed to generate schedule.");
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center"><ListOrdered className="mr-2" /> Race Setup</CardTitle>
                <CardDescription>Select how many races each player will participate in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>Number of Players: <strong>{players.length}</strong></p>
                {validOptions.length > 0 ? (
                    <div>
                        <label htmlFor="races-select" className="block text-sm font-medium mb-1">Races per Player:</label>
                        <Select value={selectedAppearances} onValueChange={setSelectedAppearances}>
                            <SelectTrigger id="races-select">
                                <SelectValue placeholder="Select number of races..." />
                            </SelectTrigger>
                            <SelectContent>
                                {validOptions.map(option => (
                                    <SelectItem key={option} value={option.toString()}>
                                        {option} races per player ({players.length * option / 4} total races)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total player entries ({players.length} × {selectedAppearances || '?'}) must be divisible by 4 for full races.
                        </p>
                    </div>
                ) : (
                    <Alert variant="destructive">
                        <AlertTitle>Invalid Player Count</AlertTitle>
                        <AlertDescription>
                            Cannot form full races of 4 with {players.length} players. Please add or remove players until the total count allows for a valid schedule (e.g., 4, 8, 12 players often work well).
                        </AlertDescription>
                    </Alert>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleGenerateSchedule}
                    disabled={!selectedAppearances || validOptions.length === 0}
                    className="w-full"
                >
                    <Shuffle className="mr-2 h-4 w-4" /> Generate Schedule
                </Button>
            </CardFooter>
        </Card>
    );
}

interface LeaderboardProps {
    scores: Scores;
    players: Player[];
    isFinal: boolean;
}

function Leaderboard({ scores, players, isFinal }: LeaderboardProps) {
    const sortedPlayers = [...players].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0) || a.localeCompare(b));

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Trophy className="mr-2" /> {isFinal ? 'Final Standings' : 'Live Standings'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Rank</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedPlayers.map((player, index) => (
                            <TableRow key={player}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>{player}</TableCell>
                                <TableCell className="text-right">{scores[player] ?? 0}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

interface RaceResultInputProps {
    race: Race;
    raceNumber: number;
    totalRaces: number;
    onSubmitResult: (result: Race) => void;
}

function RaceResultInput({ race, raceNumber, totalRaces, onSubmitResult }: RaceResultInputProps) {

    const [error, setError] = useState<string | null>(null);

    // Use drag and drop for ordering?
    // For simplicity, let's use selects first.
    const [pos1, setPos1] = useState('');
    const [pos2, setPos2] = useState('');
    const [pos3, setPos3] = useState('');
    const [pos4, setPos4] = useState('');

    const availablePlayers = (exclude: string[]) => race.filter(p => !exclude.includes(p));

    const handleSubmit = () => {
        setError(null);
        const result = [pos1, pos2, pos3, pos4];
        if (result.some(p => !p)) {
            setError("Please assign all finishing positions.");
            return;
        }
        const resultSet = new Set(result);
        if (resultSet.size !== 4) {
            setError("Each player must be assigned a unique position.");
            return;
        }
        if (!result.every(p => race.includes(p))) {
            setError("Result includes players not in this race."); // Should not happen with selects
            return;
        }
        onSubmitResult(result);
        // Reset for next race (although component might unmount/remount)
        setPos1(''); setPos2(''); setPos3(''); setPos4('');
    };

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><Play className="mr-2" /> Race {raceNumber} / {totalRaces}</CardTitle>
                <CardDescription>Racers: <strong>{race.join(', ')}</strong></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="font-medium">Enter Finishing Order:</p>
                <div className="grid grid-cols-2 gap-4">
                    {[setPos1, setPos2, setPos3, setPos4].map((setter, index) => {
                        const currentSelection = [pos1, pos2, pos3, pos4];
                        const value = currentSelection[index];
                        const available = availablePlayers(currentSelection.filter((_, i) => i !== index));
                        return (
                            <div key={index}>
                                <label htmlFor={`pos-${index+1}`} className="block text-sm font-medium mb-1">{index + 1}{['st', 'nd', 'rd', 'th'][index]} Place:</label>
                                <Select value={value} onValueChange={setter}>
                                    <SelectTrigger id={`pos-${index+1}`}>
                                        <SelectValue placeholder="Select player..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Keep current selection visible only if it has a value */}
                                        {value && <SelectItem value={value}>{value}</SelectItem>}
                                        {/* Filter out the current value from the available list before mapping */}
                                        {available
                                            .filter(p => p !== value) // Prevent duplicate if value is also in available
                                            .map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        );
                    })}
                </div>
                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTitle>Input Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleSubmit} className="w-full">
                    Submit Race {raceNumber} Results
                </Button>
            </CardFooter>
        </Card>
    );
}

// --- Main App Component --- //

function App() {
    const [phase, setPhase] = useState<GamePhase>('setup');
    const [players, setPlayers] = useState<Player[]>(['', '', '', '']); // Start with 4 empty slots
    const [, setRacesPerPlayer] = useState<number>(0);
    const [schedule, setSchedule] = useState<Schedule>([]);
    const [scores, setScores] = useState<Scores>({});
    const [currentRaceIndex, setCurrentRaceIndex] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const finalizedPlayers = players.map(p => p.trim()).filter(p => p !== '');
    const uniquePlayers = Array.from(new Set(finalizedPlayers));
    const canProceedToSetup = uniquePlayers.length >= MIN_PLAYERS && uniquePlayers.length === finalizedPlayers.length;

    const handleScheduleReady = (newSchedule: Schedule, appearances: number) => {
        setSchedule(newSchedule);
        setRacesPerPlayer(appearances);
        setScores(Object.fromEntries(uniquePlayers.map(p => [p, 0])));
        setCurrentRaceIndex(0);
        setPhase('racing');
        setError(null);
    };

    // Modal state + logic replacing the old alert
    const [shotModalData, setShotModalData] = useState<{ open: boolean; player: string; isLastRace: boolean }>({
      open: false,
      player: '',
      isLastRace: false,
    });
    const pendingNextActionRef = React.useRef<() => void>(() => {});

    useEffect(() => {
      if (!shotModalData.open) return;

      // Build modal container
      const container = document.createElement('div');
      container.className = 'fixed inset-0 z-50 flex items-center justify-center';

      container.innerHTML = `
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative z-10 w-full max-w-sm mx-auto px-4">
          <div class="bg-white dark:bg-neutral-900 shadow-xl rounded-lg border p-6 animate-in fade-in zoom-in-95">
        <div class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
        ${shotModalData.player}, it's shot time!!!
          </h2>
        </div>

        <div class="w-full aspect-video mb-5 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center rounded-md border border-dashed border-gray-300 dark:border-neutral-700 overflow-hidden">
          <img
        src="${new URL('./assets/shots.gif', import.meta.url).href}"
        alt="Shots gif"
        class="w-full h-full object-cover"
          />
        </div>

        <div class="space-y-3 text-sm">
          <div class="flex items-center gap-2">

          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button type="button" data-continue
        class="flex-1 inline-flex items-center justify-center h-10 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow">
        Continue
          </button>
        </div>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      const closeModal = () => {
        setShotModalData(s => ({ ...s, open: false }));
      };

      const handleContinue = () => {
        closeModal();
        pendingNextActionRef.current();
      };

      container.querySelector('[data-continue]')?.addEventListener('click', handleContinue);
      container.querySelector('[data-skip]')?.addEventListener('click', closeModal);

      const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeModal();
      };
      window.addEventListener('keydown', escHandler);

      return () => {
        window.removeEventListener('keydown', escHandler);
        container.remove();
      };
    }, [shotModalData]);

    const handleRaceResultSubmit = (result: Race) => {
      const newScores = { ...scores };
      result.forEach((player, index) => {
        newScores[player] = (newScores[player] ?? 0) + POINTS[index];
      });
      setScores(newScores);

      const lastPlayer = result[3];
      const finished = currentRaceIndex + 1 >= schedule.length;

      // Defer advancing until modal confirmation
      pendingNextActionRef.current = () => {
        if (finished) {
          setPhase('finished');
        } else {
          setCurrentRaceIndex(i => i + 1);
        }
      };

      setShotModalData({
        open: true,
        player: lastPlayer,
        isLastRace: finished,
      });
    };

    const handleRestart = () => {
        setPlayers(['', '', '', '']);
        setSchedule([]);
        setScores({});
        setCurrentRaceIndex(0);
        setRacesPerPlayer(0);
        setError(null);
        setPhase('setup');
    };

    const renderPhase = () => {
        switch (phase) {
            case 'setup':
                return (
                    <div className="space-y-6 flex flex-col items-center">
                        <PlayerInput players={players} setPlayers={setPlayers} />
                        <Button
                            onClick={() => setPhase('scheduling')}
                            disabled={!canProceedToSetup}
                            size="lg"
                        >
                            Next: Setup Races
                        </Button>
                        {!canProceedToSetup && finalizedPlayers.length >= MIN_PLAYERS && (
                             <p className="text-sm text-red-500">Please ensure all names are unique.</p>
                        )}
                         {!canProceedToSetup && finalizedPlayers.length < MIN_PLAYERS && (
                             <p className="text-sm text-muted-foreground">Need at least {MIN_PLAYERS} players.</p>
                        )}
                    </div>
                );
            case 'scheduling':
                return (
                    <div className="space-y-6 flex flex-col items-center">
                        <ScheduleSetup players={uniquePlayers} onScheduleReady={handleScheduleReady} />
                        <Button variant="outline" onClick={() => setPhase('setup')}>
                            Back to Player Setup
                        </Button>
                    </div>
                );
            case 'racing':
                return (
                    <div className="space-y-6 flex flex-col items-center w-full px-4">
                        <RaceResultInput
                            race={schedule[currentRaceIndex]}
                            raceNumber={currentRaceIndex + 1}
                            totalRaces={schedule.length}
                            onSubmitResult={handleRaceResultSubmit}
                        />
                        <Leaderboard scores={scores} players={uniquePlayers} isFinal={false} />
                        {/* Optional: Show full schedule?
                        <details>
                            <summary>Show Full Schedule</summary>
                            <pre>{JSON.stringify(schedule, null, 2)}</pre>
                        </details> */}
                    </div>
                );
            case 'finished':
                return (
                    <div className="space-y-6 flex flex-col items-center">
                        <Leaderboard scores={scores} players={uniquePlayers} isFinal={true} />
                        <Button onClick={handleRestart} size="lg">
                            <Repeat className="mr-2 h-4 w-4" /> Start New Tournament
                        </Button>
                    </div>
                );
            default:
                return <p>Unknown phase</p>;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col items-center justify-center p-4 pt-10">
            <Card className="mb-8 max-w-lg w-full bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold flex items-center justify-center">
                        <Dices className="mr-3 h-8 w-8 text-purple-600" /> Lharba
                    </CardTitle>
                    <CardDescription>Wallah Lina fini pas Top 1!</CardDescription>
                </CardHeader>
            </Card>

            {error && (
                <Alert variant="destructive" className="mb-4 max-w-md">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {renderPhase()}

            <footer className="mt-8 text-center text-xs text-gray-500">
                Created Exclusively for fun! <br />
            </footer>
        </div>
    );
}

export default App;
