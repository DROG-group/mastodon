// /home/mastodon/live/app/javascript/flavours/glitch/components/status_content.jsx
import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import { FormattedMessage, injectIntl } from 'react-intl';

import classnames from 'classnames';

import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';

import { Icon } from 'flavours/glitch/components/icon';
import { autoPlayGif, languages as preloadedLanguages } from 'flavours/glitch/initial_state';
import { decode as decodeIDNA } from 'flavours/glitch/utils/idna';

import Permalink from './permalink';

const textMatchesTarget = (text, origin, host) => {
  return (text === origin || text === host
          || text.startsWith(origin + '/') || text.startsWith(host + '/')
          || 'www.' + text === host || ('www.' + text).startsWith(host + '/'));
};

const isLinkMisleading = (link) => {
  let linkTextParts = [];

  // Reconstruct visible text, as we do not have much control over how links
  // from remote software look, and we can't rely on `innerText` because the
  // `invisible` class does not set `display` to `none`.

  const walk = (node) => {
    switch (node.nodeType) {
    case Node.TEXT_NODE:
      linkTextParts.push(node.textContent);
      break;
    case Node.ELEMENT_NODE:
      if (node.classList.contains('invisible')) return;
      const children = node.childNodes;
      for (let i = 0; i < children.length; i++) {
        walk(children[i]);
      }
      break;
    }
  };

  walk(link);

  const linkText = linkTextParts.join('');
  const targetURL = new URL(link.href);

  if (targetURL.protocol === 'magnet:') {
    return !linkText.startsWith('magnet:');
  }

  if (targetURL.protocol === 'xmpp:') {
    return !(linkText === targetURL.href || 'xmpp:' + linkText === targetURL.href);
  }

  // The following may not work with international domain names
  if (textMatchesTarget(linkText, targetURL.origin, targetURL.host) || textMatchesTarget(linkText.toLowerCase(), targetURL.origin, targetURL.host)) {
    return false;
  }

  // The link hasn't been recognized, maybe it features an international domain name
  const hostname = decodeIDNA(targetURL.hostname).normalize('NFKC');
  const host = targetURL.host.replace(targetURL.hostname, hostname);
  const origin = targetURL.origin.replace(targetURL.host, host);
  const text = linkText.normalize('NFKC');
  return !(textMatchesTarget(text, origin, host) || textMatchesTarget(text.toLowerCase(), origin, host));
};

class TranslateButton extends PureComponent {

  static propTypes = {
    translation: ImmutablePropTypes.map,
    onClick: PropTypes.func,
  };

  render () {
    const { translation, onClick } = this.props;

    if (translation) {
      const language     = preloadedLanguages.find(lang => lang[0] === translation.get('detected_source_language'));
      const languageName = language ? language[2] : translation.get('detected_source_language');
      const provider     = translation.get('provider');

      return (
        <div className='translate-button'>
          <div className='translate-button__meta'>
            <FormattedMessage id='status.translated_from_with' defaultMessage='Translated from {lang} using {provider}' values={{ lang: languageName, provider }} />
          </div>

          <button className='link-button' onClick={onClick}>
            <FormattedMessage id='status.show_original' defaultMessage='Show original' />
          </button>
        </div>
      );
    }

    return (
      <button className='status__content__translate-button' onClick={onClick}>
        <FormattedMessage id='status.translate' defaultMessage='Translate' />
      </button>
    );
  }

}

const mapStateToProps = state => ({
  languages: state.getIn(['server', 'translationLanguages', 'items']),
  accountId: state.getIn(['meta', 'me']),
});

class StatusContent extends PureComponent {

  static contextTypes = {
    identity: PropTypes.object,
  };

  static propTypes = {
    status: ImmutablePropTypes.map.isRequired,
    expanded: PropTypes.bool,
    collapsed: PropTypes.bool,
    onExpandedToggle: PropTypes.func,
    onTranslate: PropTypes.func,
    media: PropTypes.node,
    extraMedia: PropTypes.node,
    mediaIcons: PropTypes.arrayOf(PropTypes.string),
    parseClick: PropTypes.func,
    disabled: PropTypes.bool,
    onUpdate: PropTypes.func,
    tagLinks: PropTypes.bool,
    rewriteMentions: PropTypes.string,
    languages: ImmutablePropTypes.map,
    intl: PropTypes.object,
  };

  static defaultProps = {
    tagLinks: true,
    rewriteMentions: 'no',
  };

  state = {
    hidden: true,
  };

  createSvgCarousel = (link, svgs, fundamentals) => {
    const { statusId, accountId } = fundamentals;
    const svgLinks = svgs.split('|');  // Split the SVG URLs into an array
  
    // Create carousel container
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container custom-carousel-container';
    carouselContainer.className += ' mention hashtag status-link';
  
    // Create basic CSS in code
    carouselContainer.style.display = 'flex';
    carouselContainer.style.flexDirection = 'column';
    carouselContainer.style.alignItems = 'center';
    carouselContainer.style.gap = '10px';
    carouselContainer.style.width = '100%';
    carouselContainer.style.margin = 'auto';
  
  
    // Create SVG container
    const svgContainer = document.createElement('div');
    svgContainer.className = 'svg-container';
    svgContainer.style.width = '100%';
    svgContainer.style.height = '0';
    svgContainer.style.paddingBottom = '50%';  // This makes it square
    svgContainer.style.position = 'relative';  // If you want to maintain the aspect ratio
     
  
    // Initial SVG
    const initialSvg = document.createElement('object');
    initialSvg.data = svgLinks[0];
    initialSvg.type = "image/svg+xml";
    initialSvg.style.position = 'absolute';
    initialSvg.style.top = '0';
    initialSvg.style.left = '0';
    initialSvg.style.width = '100%';
    initialSvg.style.height = '100%';  
    svgContainer.appendChild(initialSvg);
  
    // Create controls
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    
const prevButton = document.createElement('button');
    prevButton.innerHTML = '<<';
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '>>';
    const selectButton = document.createElement('button');
    selectButton.innerHTML = 'Select this option';
    selectButton.style = "margin: 0 auto; display: block; background-color: #3498DB; color: white; padding: 4px; font-size: 12px; border: none; cursor: pointer;";
    nextButton.style = "margin: 0 auto; display: block; background-color: #3498DB; color: white; padding: 4px; font-size: 12px; border: none; cursor: pointer;";
    prevButton.style = "margin: 0 auto; display: block; background-color: #3498DB; color: white; padding: 4px; font-size: 12px; border: none; cursor: pointer;";
    nextButton.className = 'api-button';
    selectButton.className = 'api-button';
    prevButton.className = 'api-button';

    let currentSvgIndex = 0;
  
    prevButton.onclick = () => {
      if (currentSvgIndex > 0) {
        currentSvgIndex--;
        initialSvg.data = svgLinks[currentSvgIndex];
      }
    };
  
    nextButton.onclick = () => {
      if (currentSvgIndex < svgLinks.length - 1) {
        currentSvgIndex++;
        initialSvg.data = svgLinks[currentSvgIndex];
      }
    };
  
    selectButton.onclick = () => {
      const originalUrl = new URL(link.getAttribute('href'));
      // Extract the widgetId
      const widgetId = originalUrl.searchParams.get('id');

      // Construct a clean URL, removing query strings
      const cleanUrl = `${originalUrl.protocol}//${originalUrl.hostname}${originalUrl.pathname}`;

      // Append new parameters along with the widgetId
      const apiUrl = `${cleanUrl}?id=${widgetId}&selectedSlide=${currentSvgIndex + 1}&statusId=${statusId}&accountId=${accountId}`;
      console.log("Sending GET request to: ", apiUrl);

      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          console.log("API response:", data);
        })
        .catch(error => {
          console.error("Error sending API request:", error);
        });
    };
  
    controls.appendChild(prevButton);
    controls.appendChild(selectButton);
    controls.appendChild(nextButton);
    controls.style.display = 'flex';
    controls.style.justifyContent = 'space-between'; // This will make them justified
    controls.style.width = '100%';
    controls.style.marginTop = '10px';  // Add some space between the SVG and the buttons
    
  
    // Append everything to carousel container
    carouselContainer.appendChild(svgContainer);
    carouselContainer.appendChild(controls);
  
    link.replaceWith(carouselContainer);
  };

    // Widget createApiDropdown

    createApiDropdown = (link, options, fundamentals) => {
      const { statusId, accountId } = fundamentals;
      const dropdownOptions = options.split('|');  // Split the options string into an array based on the pipe delimiter
    
      const dropdown = document.createElement('select');
      dropdown.className = 'api-dropdown custom-dropdown'; // Added 'custom-dropdown' class
        // Add classes similar to mention, hashtag, and status-link
      dropdown.className += ' mention hashtag status-link';

      // Add inline styles to center the dropdown
        dropdown.style = "margin: 0 auto; display: block; background-color: #3498DB; color: white; padding: 4px; font-size: 12px; border: none; cursor: pointer;";

      // Add command (disabled state)
      const defOption = document.createElement('option');
      defOption.text = "-- Select your answer --";
      defOption.value = "";
      defOption.disabled = true;
      defOption.selected = true;
      dropdown.add(defOption);
    
      dropdownOptions.forEach((optionLabel) => {
        const option = document.createElement('option');
        option.value = optionLabel;
        option.text = optionLabel;
        dropdown.add(option);
      });
    
      dropdown.onchange = (event) => {
        const originalUrl = new URL(link.getAttribute('href'));

        // Extract the widgetId
        const widgetId = originalUrl.searchParams.get('id');
      
        // Construct a clean URL, removing query strings
        const cleanUrl = `${originalUrl.protocol}//${originalUrl.hostname}${originalUrl.pathname}`;
      
        // Get the selected option
        const selectedOption = event.target.value;
      
        // Append new parameters along with the widgetId
        const apiUrl = `${cleanUrl}?id=${widgetId}&optionSelected=${selectedOption}&statusId=${statusId}&accountId=${accountId}`;
       
        // Send GET request to API
        // CSP and CORS (serverside) will be compromised if we send a GET request: 
        // .../config/initializers/content_security_policy.rb add
        //   p.connect_src     :self, :blob, :data, Rails.configuration.x.streaming_api_base_url,
        //   *data_hosts, "https://api.xn--sft219bi3tzwd.com"
        // remote_interaction_helper_controller.rb add
        //   p.connect_src     :self, "https://api.xn--sft219bi3tzwd.com"
        //  add CORS to your nginx configuration 
        //  add the following inside your location block:
        // add_header 'Access-Control-Allow-Origin' 'https://mastodon.xn--sft219bi3tzwd.com';
        // add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';

        console.log("Sending GET request to:", apiUrl); // Debug line

        fetch(apiUrl)
          .then(response => response.json())
          .then(data => {
            // Handle API response data here
          })
          .catch(error => {
            console.error("Error sending API request:", error);
          });
      };
    
      // Replace the original link with the dropdown
      link.replaceWith(dropdown);
    }
    

  // Widget createApiButtons
   createApiButtons = (link, buttons, fundamentals) => {
    const { statusId, accountId } = fundamentals;
    const buttonLabels = buttons.split('|');  // Split the buttons string into an array based on the pipe delimiter
  
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'api-button-container custom-button-container'; // Added 'custom-button-container' class
  
    buttonLabels.forEach((buttonLabel) => {
      const button = document.createElement('button');
      button.style = "background-color: #3498DB; color: white; padding: 4px; font-size: 12px; border: none; cursor: pointer;";
      button.innerHTML = buttonLabel;  // Set button text
      button.className = 'api-button custom-button';  // Added 'custom-button' class
  
      // Add inline styles to center and space buttons
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'center';
      buttonContainer.style.gap = '10px';
  
      button.onclick = () => {
       // Get the original URL
      const originalUrl = new URL(link.getAttribute('href'));

      // Extract the widgetId
      const widgetId = originalUrl.searchParams.get('id');

      // Construct a clean URL, removing query strings
      const cleanUrl = `${originalUrl.protocol}//${originalUrl.hostname}${originalUrl.pathname}`;

      // Append new parameters along with the widgetId
      const apiUrl = `${cleanUrl}?id=${widgetId}&buttonClicked=${buttonLabel}&statusId=${statusId}&accountId=${accountId}`;
      console.log("Sending GET request to: ", apiUrl);

        // Send GET request to API
        fetch(apiUrl)
          .then(response => response.json())
          .then(data => {
            // Handle API response data here
          })
          .catch(error => {
            console.error("Error sending API request:", error);
          });
      };
  
      buttonContainer.appendChild(button);
    });
  
    // Replace the original link with the button container
    link.replaceWith(buttonContainer);
  }

widgetRouter = (status, link) => {
  const href = link.getAttribute('href');
  const url = new URL(href);
  const params = new URLSearchParams(url.search);

  // Retrieve statusId and accountId
  const statusId = status.get('id');
//  const accountId = status.getIn(['account', 'id']);
// Get accountId of logged in user
  const { accountId } = this.props;

  const fundamentals = { statusId, accountId };

  // Check for 'buttons' parameter in URL
  if (params.has('buttons')) {
    const buttons = params.get('buttons');
    this.createApiButtons(link, buttons, fundamentals);
    return;  // Exit after finding a match
  }

  // Check for 'dropdown' parameter in URL
  if (params.has('dropdown')) {
    const options = params.get('dropdown');
    this.createApiDropdown(link, options, fundamentals);
    return;  // Exit after finding a match
  }

  // Check for 'carousel' parameter in URL
  if (params.has('carousel')) {
    const svgs = params.get('carousel');
    this.createSvgCarousel(link, svgs, fundamentals);
    return;  // Exit after finding a match
  }

  // No matching widgets found
}


  _updateStatusLinks () {
    const node = this.contentsNode;
    const { tagLinks, rewriteMentions } = this.props;
    const primaryDomain = window.location.hostname.split('.').slice(-2).join('.');
    const targetHref = `https://api.${primaryDomain}/widgets`;
    
    if (!node) {
      return;
    }

    const links = node.querySelectorAll('a');

    for (var i = 0; i < links.length; ++i) {
      let link = links[i];
      if (link.classList.contains('status-link')) {
        continue;
      }
      link.classList.add('status-link');

      const href = link.getAttribute('href');

      if (href && href.includes(targetHref)) {
        this.widgetRouter(this.props.status, link);  
        continue;  
      }

      let mention = this.props.status.get('mentions').find(item => link.href === item.get('url'));

      if (mention) {
        link.addEventListener('click', this.onMentionClick.bind(this, mention), false);
        link.setAttribute('title', `@${mention.get('acct')}`);
        if (rewriteMentions !== 'no') {
          while (link.firstChild) link.removeChild(link.firstChild);
          link.appendChild(document.createTextNode('@'));
          const acctSpan = document.createElement('span');
          acctSpan.textContent = rewriteMentions === 'acct' ? mention.get('acct') : mention.get('username');
          link.appendChild(acctSpan);
        }
      } else if (link.textContent[0] === '#' || (link.previousSibling && link.previousSibling.textContent && link.previousSibling.textContent[link.previousSibling.textContent.length - 1] === '#')) {
        link.addEventListener('click', this.onHashtagClick.bind(this, link.text), false);
      } else {
        link.addEventListener('click', this.onLinkClick.bind(this), false);
        link.setAttribute('title', link.href);
        link.classList.add('unhandled-link');

        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener nofollow noreferrer');

        try {
          if (tagLinks && isLinkMisleading(link)) {
            // Add a tag besides the link to display its origin

            const url = new URL(link.href);
            const tag = document.createElement('span');
            tag.classList.add('link-origin-tag');
            switch (url.protocol) {
            case 'xmpp:':
              tag.textContent = `[${url.href}]`;
              break;
            case 'magnet:':
              tag.textContent = '(magnet)';
              break;
            default:
              tag.textContent = `[${url.host}]`;
            }
            link.insertAdjacentText('beforeend', ' ');
            link.insertAdjacentElement('beforeend', tag);
          }
        } catch (e) {
          // The URL is invalid, remove the href just to be safe
          if (tagLinks && e instanceof TypeError) link.removeAttribute('href');
        }
      }
    }
  }



  handleMouseEnter = ({ currentTarget }) => {
    if (autoPlayGif) {
      return;
    }

    const emojis = currentTarget.querySelectorAll('.custom-emoji');

    for (var i = 0; i < emojis.length; i++) {
      let emoji = emojis[i];
      emoji.src = emoji.getAttribute('data-original');
    }
  };

  handleMouseLeave = ({ currentTarget }) => {
    if (autoPlayGif) {
      return;
    }

    const emojis = currentTarget.querySelectorAll('.custom-emoji');

    for (var i = 0; i < emojis.length; i++) {
      let emoji = emojis[i];
      emoji.src = emoji.getAttribute('data-static');
    }
  };

  componentDidMount () {
    this._updateStatusLinks();
  }

  componentDidUpdate () {
    this._updateStatusLinks();
    if (this.props.onUpdate) this.props.onUpdate();
  }

  onLinkClick = (e) => {
    if (this.props.collapsed) {
      if (this.props.parseClick) this.props.parseClick(e);
    }
  };

  onMentionClick = (mention, e) => {
    if (this.props.parseClick) {
      this.props.parseClick(e, `/@${mention.get('acct')}`);
    }
  };

  onHashtagClick = (hashtag, e) => {
    hashtag = hashtag.replace(/^#/, '');

    if (this.props.parseClick) {
      this.props.parseClick(e, `/tags/${hashtag}`);
    }
  };

  handleMouseDown = (e) => {
    this.startXY = [e.clientX, e.clientY];
  };

  handleMouseUp = (e) => {
    const { parseClick, disabled } = this.props;

    if (disabled || !this.startXY) {
      return;
    }

    const [ startX, startY ] = this.startXY;
    const [ deltaX, deltaY ] = [Math.abs(e.clientX - startX), Math.abs(e.clientY - startY)];

    let element = e.target;
    while (element !== e.currentTarget) {
      if (['button', 'video', 'a', 'label', 'canvas'].includes(element.localName) || element.getAttribute('role') === 'button') {
        return;
      }
      element = element.parentNode;
    }

    if (deltaX + deltaY < 5 && e.button === 0 && parseClick) {
      parseClick(e);
    }

    this.startXY = null;
  };

  handleSpoilerClick = (e) => {
    e.preventDefault();

    if (this.props.onExpandedToggle) {
      this.props.onExpandedToggle();
    } else {
      this.setState({ hidden: !this.state.hidden });
    }
  };

  handleTranslate = () => {
    this.props.onTranslate();
  };

  setContentsRef = (c) => {
    this.contentsNode = c;
  };

  render () {
    const {
      status,
      media,
      extraMedia,
      mediaIcons,
      parseClick,
      disabled,
      tagLinks,
      rewriteMentions,
      intl,
    } = this.props;

    const hidden = this.props.onExpandedToggle ? !this.props.expanded : this.state.hidden;
    const contentLocale = intl.locale.replace(/[_-].*/, '');
    const targetLanguages = this.props.languages?.get(status.get('language') || 'und');
    const renderTranslate = this.props.onTranslate && this.context.identity.signedIn && ['public', 'unlisted'].includes(status.get('visibility')) && status.get('search_index').trim().length > 0 && targetLanguages?.includes(contentLocale);

    const content = { __html: status.getIn(['translation', 'contentHtml']) || status.get('contentHtml') };
    const spoilerContent = { __html: status.getIn(['translation', 'spoilerHtml']) || status.get('spoilerHtml') };
    const language = status.getIn(['translation', 'language']) || status.get('language');
    const classNames = classnames('status__content', {
      'status__content--with-action': parseClick && !disabled,
      'status__content--with-spoiler': status.get('spoiler_text').length > 0,
    });

    const translateButton = renderTranslate && (
      <TranslateButton onClick={this.handleTranslate} translation={status.get('translation')} />
    );

    if (status.get('spoiler_text').length > 0) {
      let mentionsPlaceholder = '';

      const mentionLinks = status.get('mentions').map(item => (
        <Permalink
          to={`/@${item.get('acct')}`}
          href={item.get('url')}
          key={item.get('id')}
          className='mention'
        >
          @<span>{item.get('username')}</span>
        </Permalink>
      )).reduce((aggregate, item) => [...aggregate, item, ' '], []);

      let toggleText = null;
      if (hidden) {
        toggleText = [
          <FormattedMessage
            id='status.show_more'
            defaultMessage='Show more'
            key='0'
          />,
        ];
        if (mediaIcons) {
          mediaIcons.forEach((mediaIcon, idx) => {
            toggleText.push(
              <Icon
                fixedWidth
                className='status__content__spoiler-icon'
                id={mediaIcon}
                aria-hidden='true'
                key={`icon-${idx}`}
              />,
            );
          });
        }
      } else {
        toggleText = (
          <FormattedMessage
            id='status.show_less'
            defaultMessage='Show less'
            key='0'
          />
        );
      }

      if (hidden) {
        mentionsPlaceholder = <div>{mentionLinks}</div>;
      }

      return (
        <div className={classNames} tabIndex={0} onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp}>
          <p
            style={{ marginBottom: hidden && status.get('mentions').isEmpty() ? '0px' : null }}
          >
            <span dangerouslySetInnerHTML={spoilerContent} className='translate' lang={language} />
            {' '}
            <button type='button' className='status__content__spoiler-link' onClick={this.handleSpoilerClick} aria-expanded={!hidden}>
              {toggleText}
            </button>
          </p>

          {mentionsPlaceholder}

          <div className={`status__content__spoiler ${!hidden ? 'status__content__spoiler--visible' : ''}`}>
            <div
              ref={this.setContentsRef}
              key={`contents-${tagLinks}`}
              tabIndex={!hidden ? 0 : null}
              dangerouslySetInnerHTML={content}
              className='status__content__text translate'
              onMouseEnter={this.handleMouseEnter}
              onMouseLeave={this.handleMouseLeave}
              lang={language}
            />
            {!hidden && translateButton}
            {media}
          </div>

          {extraMedia}
        </div>
      );
    } else if (parseClick) {
      return (
        <div
          className={classNames}
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.handleMouseUp}
          tabIndex={0}
        >
          <div
            ref={this.setContentsRef}
            key={`contents-${tagLinks}-${rewriteMentions}`}
            dangerouslySetInnerHTML={content}
            className='status__content__text translate'
            tabIndex={0}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            lang={language}
          />
          {translateButton}
          {media}
          {extraMedia}
        </div>
      );
    } else {
      return (
        <div
          className='status__content'
          tabIndex={0}
        >
          <div
            ref={this.setContentsRef}
            key={`contents-${tagLinks}`}
            className='status__content__text translate'
            dangerouslySetInnerHTML={content}
            tabIndex={0}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            lang={language}
          />
          {translateButton}
          {media}
          {extraMedia}
        </div>
      );
    }
  }

}

export default connect(mapStateToProps)(injectIntl(StatusContent));
