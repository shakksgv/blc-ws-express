<template>
  <div>
    <template v-if="active">
      <h2>Crawling {{ value }}</h2>
      <div class="filtering">
        <div>Show OK <switches theme="bulma" :color="showWorking ? 'blue' : 'default'" v-model="showWorking"/></div>
        <div>Show BROKEN <switches theme="bulma" :color="showBroken ? 'blue' : 'default'" v-model="showBroken"/></div>
        <button @click="cancel">Cancel</button>
      </div>
      <div>
        <div class="link__group" v-for="(item, index) in items" :key="index">
        <div class="link__source" :class="item.links.some(el => !el.status) ? 'red' : 'green'">
          <div class="link__source__name" @click="open(index)">{{ item.source }}</div>
          <div class="link__total">total: {{ item.links.length }}</div>
        </div>
        <div class="link__item" v-if="(!link.status && showBroken) || (link.status && showWorking) || index === expanded" v-for="(link, index) in item.links" :key="index">
          <div class="link__status" :class="link.status ? 'green' : 'red'">{{ link.status ? 'OK' : 'BROKEN' }}</div>
          <div class="link__url"> {{ link.href }}</div>
        </div>
      </div>
      </div>
    </template>

    <form novalidate @submit.prevent v-else>
      <input type="text" v-model="value">
      <button type="submit" @click="send">Crawl website</button>
    </form>
  </div>
</template>

<script>
import Switches from 'vue-switches';

export default {
  name: 'app',
  components: {
      Switches
  },
  data() {
    return {
      value: 'https://m.africa.asaptickets.com',
      active: false,
      showBroken: true,
      showWorking: false,
      expanded: -1,
      items: [],
    }
  },
  methods: {
    send() {
      if (!this.active) {
          this.active = true;
          this.$socket.emit("blc", this.value);
      }
    },
    open(index) {
      if (this.expanded === index) {
          this.expanded = -1;
      } else {
          this.expanded = index;
      }
    },
    cancel() {
      this.$socket.emit('blc-cancel');
    }
  },
  socket: {
    events: {
      'blc-status'(data) {
        const { url, links } = data;
        this.url = url;
        this.items = links;
      },
      'blc-new-group'(source) {
          this.items.push({
              source,
              links: []
          });
      },
      'blc-response'(key, value) {
        this.active = true;
        this.items.find(el => {
          return el.source === key;
        }).links.push(value);
      }
    }
  }
}
</script>

<style scoped lang="scss">

.filtering {
  div {
    margin: 8px 0;
  }
}

.link {

  &__group {
    margin-top: 15px;
    border: 1px solid grey;
  }

  &__source {
    padding: 3px 8px;
    display: flex;
    justify-content: space-between;
    color: white;

    &.green {
      background: #27ae60;
    }

    &.red {
      background: #ea6153;
    }

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

    &.green { color: green; }
    &.red { color: red; }
  }

  &__total {
    padding-left: 10px;
  }
}
</style>
