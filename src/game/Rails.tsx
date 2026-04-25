import { useWorldDefinition } from '../worlds';

export function Rails() {
  const world = useWorldDefinition();
  const WorldTrack = world.Track;

  return <WorldTrack key={world.id} />;
}
