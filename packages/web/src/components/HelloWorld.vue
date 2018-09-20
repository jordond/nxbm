<template>
  <div class="hello">
    <h3>Test: {{ msg }}</h3>
    <p>Is loading: {{ loading }}</p>
    <button @click="fetchData">refresh</button>
    <button @click="getConfig">config</button>
    <div>
      <div v-for="item in result.xcis" v-bind:key="item.file.titleid">
        <div :class="{ strikethrough: item.missing }">
          {{item.file.gameName}}
        </div>
        <br />
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { config, games } from "@nxbm/api-client";
import { Route } from "@nxbm/api-endpoints";
import { Game } from "@nxbm/types";
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class HelloWorld extends Vue {
  @Prop()
  private msg!: string;
  private loading: boolean = false;
  private result: Game[] = [];

  public created() {
    this.fetchData();
  }

  public fetchData() {
    this.loading = true;

    Route.ApiBase = "http://localhost:9999";
    games
      .getAllGames()
      .then(x => {
        this.loading = false;
        this.result = x.xcis;
      })
      .catch(err => {
        console.log("ERROR");
        console.error(err);
      });
  }

  public getConfig() {
    this.loading = true;

    config
      .getAppConfig()
      .then(x => {
        this.loading = false;
        console.log(x);
      })
      .catch(err => console.error(err));
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.strikethrough {
  text-decoration: line-through;
}
</style>
