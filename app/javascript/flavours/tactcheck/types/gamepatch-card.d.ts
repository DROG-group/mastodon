import type React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gamepatch-card': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'data-api'?: string;
          'data-uid'?: string;
          'data-card-instance-id'?: string;
          'data-bot-id'?: string;
          'data-bot-name'?: string;
          'data-payload'?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
