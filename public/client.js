(() => {
  /**
   * Global variables
   */
  const itemsEndpoint = '/items.json';

  /**
   * Initialize
   */
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('itemList');

    const renderPromise = renderHtml(el);

    const searchPromise = initSearch(renderPromise);

    initVideoLinks(renderPromise, el);

    initRouting(searchPromise);
  });

  /**
   * Fill value in search field and trigger search
   * @param {string} search string
   */
  const triggerSearch = str => {
    const searchInput = document.getElementById('searchField');
    searchInput.value = str;

    // trigger input event to fire search
    const event = new Event('input');
    searchInput.dispatchEvent(event);
    searchInput.focus();
  };

  /**
   * Routing for videos and search
   * @param {Promise} searchPromise to provide state after search initized
   */
  const initRouting = searchPromise => {
    const loadVideoFromHash = () => {
      const str = decodeURIComponent(location.hash.replace('#', ''));
      const videoEl = document.getElementById(str);

      if (videoEl) {
        // video element exists, empty search and load it
        triggerSearch('');
        const videolink = videoEl.getElementsByClassName('videolink')[0];
        loadAndPlayVideo(videolink);
      } else {
        // video not available, search the term instead
        triggerSearch(str);
      }
    };

    searchPromise.then(() => {
      // Load initial video if hash exist
      loadVideoFromHash();

      // Load video on hash change
      window.addEventListener('hashchange', loadVideoFromHash);
    });
  };

  /**
   * Init Search
   *
   * @param {Promise} renderPromise provides the search data
   * @return {Promise} get a Promise back to know when search is initialized
   */
  const initSearch = renderPromise => {
    return renderPromise
      .then(searchIndex => {
        // setup search
        const searchOptions = {
          keys: ['title', 'description', 'tags', 'people'],
          threshold: 0.2,
          tokenize: true,
          id: 'slug'
        };
        return new Fuse(searchIndex, searchOptions);
      })
      .then(fuse => {
        const input = document.getElementById('searchField');
        input.focus();

        // on search input trigger search
        input.addEventListener('input', event => {
          const searchResults = fuse.search(input.value);
          const videoList = document.getElementsByClassName('video');

          // show/hide everything
          for (const videoEl of videoList) {
            videoEl.style.display = input.value ? 'none' : '';
            // hide all parents as well and show again later
            //  // TODO: fix lower levels
            videoEl.closest('.videoparent').style.display = input.value
              ? 'none'
              : '';
          }

          searchResults.map(id => {
            const videoItem = document.getElementById(id);
            if (videoItem) {
              videoItem.style.display = '';
              // traverse dom tree up and show everything
              let element = videoItem;
              while (element.parentNode && element.id !== 'itemList') {
                element.style.display = '';
                element = element.parentNode;
              }
            }
          });
        });
      })
      .catch(e => console.log(e));
  };

  /**
   * Loads and plays the video
   * @param {domElement} videolink is the a href link to the video
   */
  const loadAndPlayVideo = videoLink => {
    const src = videoLink.getAttribute('data-video');
    const videoEl = document.getElementById('sbideo-main');
    videoEl.setAttribute('src', src);
    videoEl.play();

    // highlight active video
    const activeVideos = document.querySelectorAll('[videoactive]');
    if (activeVideos) {
      for (const videoEl of activeVideos) {
        videoEl.removeAttribute('videoactive');
      }
    }
    videoLink.setAttribute('videoactive', 'active');

    // show metadata
    const video = videoLink.closest('.video');
    const meta = video.getElementsByClassName('meta')[0];
    const activeVideoMeta = document.getElementById('activeVideoMeta');
    video.tooltipInstance.hide();
    activeVideoMeta.innerHTML = '';
    activeVideoMeta.insertAdjacentHTML(
      'beforeEnd',
      `<h2>${videoLink.innerText}</h2>`
    );
    activeVideoMeta.insertAdjacentHTML('beforeEnd', meta.outerHTML);

    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  };

  const initVideoLinks = (renderPromise, el) => {
    // add clickhandlers to video links
    el.addEventListener('click', event => {
      const isVideoLink =
        event.srcElement && event.srcElement.classList.contains('videolink');

      if (isVideoLink) {
        event.preventDefault(); // prevent jumping to target
        location.hash = event.srcElement.getAttribute('href');
      }
    });

    // initialize tooltips when html is rendered
    renderPromise.then(() => {
      const videoList = document.getElementsByClassName('video');
      for (const videoEl of videoList) {
        const videoLink = videoEl.getElementsByClassName('videolink')[0];
        const meta = videoEl.getElementsByClassName('meta')[0];
        const tooltipOptions = {
          html: true,
          placement: 'right',
          title: meta,
          trigger: 'manual'
        };
        const tooltip = new Tooltip(videoLink, tooltipOptions);
        videoEl.tooltipInstance = tooltip; // save it to dom element for later use

        // Manually open and close tooltip
        videoEl.addEventListener('mouseenter', event => {
          videoEl.tooltipInstance.show();
          meta.addEventListener('mouseleave', event =>
            videoEl.tooltipInstance.hide()
          );
        });
        videoEl.addEventListener('mouseleave', event => {
          if (!document.querySelector('.tooltip:hover')) {
            videoEl.tooltipInstance.hide();
          }
        });
      }
    });
  };

  /**
   * Helper to create slug from string
   * @param {string} text to be slugified
   */
  const slugify = text =>
    text
      .toString()
      .toLowerCase()
      .replace(/(data|video|mp4)/g, '')
      .replace(/\//g, '-') // replace video stuff
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text

  /**
   * Fetch data and render Html
   * @param {domElement} the dom element where the html gets inserted into
   * @return {Promise} returns a promise which provides the searchIndex data
   */
  const renderHtml = el => {
    const searchIndex = [];

    /**
     * Decides which type of renderer should be called
     * @param {object|array} item to render
     */
    const renderItems = item => {
      return item.type === 'video' ? renderVideo(item) : renderFolder(item);
    };

    /**
     * Recursivley render folder snippets
     * @param {object|array} folder
     */
    const renderFolder = folder => {
      if (Array.isArray(folder)) {
        return folder.map(singleFolder => renderItems(singleFolder)).join('');
      }

      const childrenExist = folder.items && folder.items.length > 0;
      const children = childrenExist
        ? `<ul>${renderItems(folder.items)}</ul>`
        : '';

      return `<li class="videoparent">
          <span class="videoparent-title">${
            folder.meta ? folder.meta.title : ''
          }</span>
          ${children}
        </li>`;
    };

    /**
     * Renders a single video information snippet
     * @param {object} item of type video
     */
    const renderVideo = item => {
      // make it searchable
      item.meta.slug = slugify(item.src);
      searchIndex.push(item.meta);

      const rTags = item.meta.tags
        .map(
          tag => `<a href="#${encodeURIComponent(tag)}" class="tag">${tag}</a>`
        )
        .join(' ');

      return `<li id="${item.meta.slug}" class="video">
        <a href="#${encodeURIComponent(
          item.meta.slug
        )}" class=" videolink" data-video="${item.src}">
          ${item.meta.title}
        </a>

        <div class="meta">
          <div class="people">
            <img class="icon" src="/octicons/build/svg/person.svg" alt="person" role="presentation"/>
            ${item.meta.people.join(', ')}
          </div>
          <div class="tags">
            ${rTags}
          </div>
        <div>

        <div class="description ">
          ${item.meta.description}
        </div>
      </li>`;
    };

    /**
     * Fetches data and initiates html rendering
     */
    return fetch(itemsEndpoint)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .then(json => {
        // initialze html rendering here
        const output = json.map(item => renderItems(item)).join('');

        el.insertAdjacentHTML('beforeEnd', output);

        return searchIndex;
      });
  };
})();
