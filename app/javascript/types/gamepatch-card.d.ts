declare namespace JSX {
  interface IntrinsicElements {
    'gamepatch-card': React.HTMLAttributes<HTMLElement> & {
      'data-uid'?: string;
      'data-api'?: string;
      'data-card-instance-id'?: string | number;
      'data-definition'?: string;
      'data-host-config'?: string;
      'data-context'?: string;
      'data-state'?: string;
      'data-data'?: string;
      'data-bot-id'?: string | number;
      'data-bot-name'?: string;
    };
  }
}
