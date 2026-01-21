interface RankBadgeProps {
  rank: number;
  size?: "sm" | "md" | "lg";
}

export default function RankBadge({ rank, size = "md" }: RankBadgeProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "gold";
      case 2:
        return "silver";
      case 3:
        return "bronze";
      default:
        return "standard";
    }
  };

  return (
    <div className={`rank-badge ${getRankClass(rank)} ${sizeClasses[size]}`}>
      {rank}
    </div>
  );
}
