import { useFeatureFlag } from '@/context/PlatformControlContext';
import {
  areRewardsEnabled as areRewardsEnabledSync,
  GAMIFICATION_REWARDS_FLAG_KEY,
} from '@/domain/gamification/rewardsGate';

/**
 * Versione React del gate centrale `areRewardsEnabled()`.
 * Re-render quando cambia il flag / schedule clock.
 */
export function useAreRewardsEnabled(): boolean {
  const flag = useFeatureFlag(GAMIFICATION_REWARDS_FLAG_KEY);
  if (flag) return flag.enabled === true;
  return areRewardsEnabledSync();
}
