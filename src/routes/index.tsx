import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

type Cell = "X" | "O" | null;

const WIN_LINES: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function calculateWinner(board: Cell[]): { winner: Cell; line: number[] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

function Index() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const result = calculateWinner(board);
  const isDraw = !result && board.every(Boolean);
  const status = result
    ? `Võitja: ${result.winner}`
    : isDraw
      ? "Viik!"
      : `Käib: ${xIsNext ? "X" : "O"}`;

  const handleClick = (i: number) => {
    if (board[i] || result) return;
    const next = board.slice();
    next[i] = xIsNext ? "X" : "O";
    setBoard(next);
    setXIsNext(!xIsNext);

    const r = calculateWinner(next);
    if (r?.winner) {
      setScores((s) => ({ ...s, [r.winner as "X" | "O"]: s[r.winner as "X" | "O"] + 1 }));
    } else if (next.every(Boolean)) {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
    }
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  const resetAll = () => {
    reset();
    setScores({ X: 0, O: 0, draws: 0 });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Trips-Traps-Trulli
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Klassikaline kahe mängija mäng
          </p>
        </header>

        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-center">
            <div className="text-xs text-muted-foreground">X</div>
            <div className="text-xl font-semibold text-foreground">{scores.X}</div>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-center">
            <div className="text-xs text-muted-foreground">Viigid</div>
            <div className="text-xl font-semibold text-foreground">{scores.draws}</div>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-center">
            <div className="text-xs text-muted-foreground">O</div>
            <div className="text-xl font-semibold text-foreground">{scores.O}</div>
          </div>
        </div>

        <div
          aria-live="polite"
          className="mb-4 text-center text-lg font-medium text-foreground"
        >
          {status}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-2">
          {board.map((cell, i) => {
            const isWinning = result?.line.includes(i);
            return (
              <button
                key={i}
                onClick={() => handleClick(i)}
                aria-label={`Ruut ${i + 1}${cell ? `, ${cell}` : ""}`}
                className={`flex aspect-square items-center justify-center rounded-lg text-5xl font-bold transition-colors ${
                  isWinning
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-accent"
                } disabled:cursor-not-allowed`}
                disabled={!!cell || !!result}
              >
                {cell}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Uus mäng</Button>
          <Button variant="outline" onClick={resetAll}>
            Lähtesta tulemus
          </Button>
        </div>
      </div>
    </main>
  );
}
