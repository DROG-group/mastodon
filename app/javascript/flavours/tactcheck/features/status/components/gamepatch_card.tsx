import { useEffect, useMemo } from 'react';

import type { Map as ImmutableMap } from 'immutable';

import 'flavours/tactcheck/gamepatch/card.css';
import { ensureGamepatchCard } from 'flavours/tactcheck/gamepatch/card_runtime';

interface GamepatchCardPayload {
  uid?: string;
  card_instance_id?: number;
  [key: string]: unknown;
}

interface GamepatchCardProps {
  card: ImmutableMap<string, unknown>;
}

export const GamepatchCard: React.FC<GamepatchCardProps> = ({ card }) => {
  const payload = useMemo(
    (): GamepatchCardPayload => card.toJS() as GamepatchCardPayload,
    [card],
  );

  useEffect(() => {
    ensureGamepatchCard();
  }, []);

  const api = payload.uid ? `/gamepatch/api/cards/${payload.uid}` : undefined;
  const cardInstanceId = payload.card_instance_id
    ? String(payload.card_instance_id)
    : undefined;
  const dataPayload = JSON.stringify(payload);

  return (
    <div className='status__gamepatch-card'>
      <gamepatch-card
        data-api={api}
        data-uid={payload.uid}
        data-card-instance-id={cardInstanceId}
        data-payload={dataPayload}
      />
    </div>
  );
};

// eslint-disable-next-line import/no-default-export
export default GamepatchCard;
