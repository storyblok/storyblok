module.exports = `<div class="quickstart__teaser">
  <!--
  The _editable attribute makes the next
  DOM-element clickable so the sidebar can
  show the right component.
  -->
  {{ blok._editable }}
  <div class="quickstart__inner-teaser">
    <svg class="icon"><use xlink:href="#icon-congrats"></use></svg>
    <h2>
      <!--
      You can access every attribute you
      define in the schema in the blok variable
      -->
      {{ blok.headline }}
      </h2>
      <h3>
        Congrats, you have created the teaser template!<br>
        <a target="_blank" href="https://www.storyblok.com/docs/Rendering-Service/Theme-Documentation">
          Read the theme documentation
        </a>
        <!-- HINT: Try to change something and the browser window in Storyblok will automatically refresh. -->
    </h3>
  </div>
</div>`
