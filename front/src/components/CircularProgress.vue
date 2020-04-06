<template>
  <div class="circular-progress" :data-value="value" :data-label="label">
      <div class="circular-progress-mask">
          <div class="circular-progress-bar"></div>
          <div class="circular-progress-bar-half"></div>
      </div>
  </div>
</template>

<script>
    export default {
        "props": {
            "value": Number,
            "label": String
        }
    }
</script>

<style lang="sass">
  @import "~bulma/sass/utilities/_all";

  $circular-progress-color: rgb(57, 32, 126) !default
  $circular-progress-background-color: lighten($circular-progress-color, 80%) !default
  $circular-progress-size: 8em !default
  $circular-progress-label-font-family: "Fira Sans" !default
  $circular-progress-label-font-weight: 200 !default
  $circular-progress-label-size: 0.34em !default
  $circular-progress-thickness: .12em !default

  .circular-progress
    position: relative
    box-sizing: border-box
    font-size: $circular-progress-size
    width: 1em
    height: 1em
    border-radius: 50%
    border: $circular-progress-thickness solid $circular-progress-background-color
    background-color: #FFF

    &[data-value^='5']:not([data-value='5']):not([data-value^='5.']),
    &[data-value^='6']:not([data-value='6']):not([data-value^='6.']),
    &[data-value^='7']:not([data-value='7']):not([data-value^='7.']),
    &[data-value^='8']:not([data-value='8']):not([data-value^='8.']),
    &[data-value^='9']:not([data-value='9']):not([data-value^='9.']),
    &[data-value^='100']
      .circular-progress-mask
        clip: rect(auto, auto, auto, auto)

    .circular-progress-mask
      position: absolute
      width: 1em
      height: 1em
      left: -$circular-progress-thickness
      top: -$circular-progress-thickness
      clip: rect(0, 1em, 1em, .5em)

      .circular-progress-bar,
      .circular-progress-bar-half
        position: absolute
        box-sizing: border-box
        border-width: $circular-progress-thickness
        border-style: solid
        border-color: $circular-progress-color
        border-radius: 50%
        width: 1em
        height: 1em
        clip: rect(0, .5em, 1em, 0)

        transition: transform 1s ease-in-out

      .circular-progress-bar-half
        display: none
        clip: rect(0, 1em, 1em, .5em)

    &[data-value^='5']:not([data-value='5']):not([data-value^='5.']),
    &[data-value^='6']:not([data-value='6']):not([data-value^='6.']),
    &[data-value^='7']:not([data-value='7']):not([data-value^='7.']),
    &[data-value^='8']:not([data-value='8']):not([data-value^='8.']),
    &[data-value^='9']:not([data-value='9']):not([data-value^='9.']),
    &[data-value^='100']
      .circular-progress-bar-half
        display: block

    @for $percentage from 1 through 100
      &[data-value="#{$percentage}"] .circular-progress-bar
        transform: rotate(#{360 * $percentage / 100}deg)

    &:after
      content: attr(data-label)
      font-family: $circular-progress-label-font-family
      font-weight: $circular-progress-label-font-weight
      font-size: $circular-progress-label-size
      height: 102%
      display: flex
      align-items: center
      justify-content: center
</style>
