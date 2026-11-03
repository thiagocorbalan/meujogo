export function sumScore(goals: number[]): number {
  return goals.reduce((total, goal) => total + goal, 0)
}
