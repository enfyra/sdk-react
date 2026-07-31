import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EnfyraProvider, useEnfyra } from '../src/index';

function Consumer() {
  const client = useEnfyra();
  return <div data-testid="client">{client ? 'ok' : 'missing'}</div>;
}

describe('@enfyra/sdk-react', () => {
  it('provides client through context', () => {
    render(
      <EnfyraProvider config={{ baseUrl: 'http://localhost:9999', auth: { strategy: 'none' } }}>
        <Consumer />
      </EnfyraProvider>,
    );
    expect(screen.getByTestId('client').textContent).toBe('ok');
  });
});
