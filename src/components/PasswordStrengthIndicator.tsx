import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'Mindestens 6 Zeichen', test: (p) => p.length >= 6 },
  { label: 'Großbuchstabe (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Kleinbuchstabe (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'Zahl (0-9)', test: (p) => /\d/.test(p) },
  { label: 'Sonderzeichen (!@#$...)', test: (p) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(p) },
];

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  className 
}) => {
  const { score, passedRequirements } = useMemo(() => {
    const passed = requirements.map(req => req.test(password));
    const passedCount = passed.filter(Boolean).length;
    return { score: passedCount, passedRequirements: passed };
  }, [password]);

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: '', color: '' };
    if (score <= 1) return { label: 'Sehr schwach', color: 'bg-destructive' };
    if (score === 2) return { label: 'Schwach', color: 'bg-orange-500' };
    if (score === 3) return { label: 'Mittel', color: 'bg-yellow-500' };
    if (score === 4) return { label: 'Stark', color: 'bg-lime-500' };
    return { label: 'Sehr stark', color: 'bg-green-500' };
  };

  const strength = getStrengthLabel();

  if (password.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Passwortstärke</span>
          <span className={cn(
            'font-medium',
            score <= 1 && 'text-destructive',
            score === 2 && 'text-orange-500',
            score === 3 && 'text-yellow-600 dark:text-yellow-400',
            score === 4 && 'text-lime-600 dark:text-lime-400',
            score === 5 && 'text-green-600 dark:text-green-400'
          )}>
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-200',
                level <= score ? strength.color : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1">
        {requirements.map((req, index) => {
          const passed = passedRequirements[index];
          return (
            <li
              key={req.label}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors duration-200',
                passed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}
            >
              {passed ? (
                <Check className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
