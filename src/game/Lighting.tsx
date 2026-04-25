import { useWorldDefinition } from '../worlds';

export function Lighting() {
  const world = useWorldDefinition();
  const WorldLighting = world.Lighting;

  return <WorldLighting key={world.id} />;
}
