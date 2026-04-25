import { useWorldDefinition } from '../worlds';

export function Tunnel() {
  const world = useWorldDefinition();
  const WorldTunnel = world.Tunnel;

  return <WorldTunnel key={world.id} />;
}
