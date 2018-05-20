<template>
  <div>
    <template v-if="active">
      <h2>Crawling {{ value }}</h2>
      <div class="filtering">
        <div>Show OK <switches theme="bulma" :color="showWorking ? 'blue' : 'default'" v-model="showWorking"/></div>
        <div>Show BROKEN <switches theme="bulma" :color="showBroken ? 'blue' : 'default'" v-model="showBroken"/></div>
        <div>Open all <switches theme="bulma" :color="showAll ? 'blue' : 'default'" v-model="showAll"/></div>
      </div>
      <div>
        <div class="link__group" v-for="(links, source) in showItems" :key="source">
        <div class="link__source">
          <div class="link__source__name" @click="open(source)">{{ source }}</div>
          <div class="link__total">total: {{ items[source].links.length }}</div>
        </div>
        <template v-if="items[source].opened || showAll">
          <div class="link__item" v-for="(item, index) in links" :key="index">
            <div class="link__status" :class="item.status ? 'green' : 'red'">{{ item.status ? 'OK' : 'BROKEN' }}</div>
            <div class="link__url"> {{ item.href }}</div>
          </div>
        </template>
      </div>
      </div>
    </template>

    <template v-else>
      <input type="text" v-model="value">
      <button @click="send">Check me some asaps</button>
    </template>
  </div>
</template>

<script>
import Vue from 'vue';
import Switches from 'vue-switches';

export default {
  name: 'app',
  components: {
      Switches
  },
  data() {
    return {
      value: '',
      active: false,
      showBroken: true,
      showWorking: false,
      showAll: true,
      items: {}
    }
  },
  computed: {
    showItems() {
      return Object.entries(this.items).reduce((acc, entry) => {
        const [ key, value ] = entry;
        acc[key] = value.links.filter(link => {
          return (link.status && this.showWorking) || (!link.status && this.showBroken);
        });

        return acc;
      }, {});
    }
  },
  methods: {
    send() {
      this.$socket.emit("blc", this.value);
      this.active = true;
    },
    open(source) {
      this.items[source].opened = !this.items[source].opened;
    }
  },
  socket: {
    events: {
      'blc-status'(data) {
        const { url, links } = data;

        if(url && links) {
          this.value = url;
          this.active = true;

          this.items = Object.entries(links).reduce((acc, el) => {
            const [key, value] = el;
            acc[key] = {
              opened: false,
              links: value
            };

            return acc;
          }, {});
        }
      },
      'blc-response'(key, value) {
        if (!this.items.hasOwnProperty(key)) {
          Vue.set(this.items, key, {
            opened: false,
            links: []
          });
        }

        this.items[key].links.push(value);
      }
    }
  }
}
</script>

<style scoped lang="scss">
.green { color: green; }
.red { color: red; }

.filtering {
  div {
    margin: 8px 0;
  }
}

.link {

  &__group {
    margin-top: 15px;
    border: 1px solid grey;

    $colors: #ea6153, #27ae60, #2980b9;

    @each $color in $colors {
      $length: length($colors);
      $index: index($colors, $color);

      &:nth-child(#{$length}n + #{$index}) {
        
        .link__source {
          background: $color;
        }
      }
    }
  }

  &__source {
    padding: 3px 8px;
    display: flex;
    justify-content: space-between;
    color: white;
    background: black;

    &__name {
      flex-grow: 1;
      cursor: pointer;
    }
  }

  &__item {
    padding: 3px 8px;
    display: flex;

    &:nth-child(odd) {
      background: #ececec;
    }
  }

  &__status {
    width: 80px;
  }

  &__total {
    padding-left: 10px;
  }
}
</style>
