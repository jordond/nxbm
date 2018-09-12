<template>
  <div class="hello">
    <h3>Test</h3>
    <p>Is loading: {{ loading }}</p>
    <div>
      <div v-for="item in result.xcis" v-bind:key="item.file.titleid">
        {{item.file.gameName}}
        <br />
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { Game } from "@nxbm/api";
import { games } from "@nxbm/api-client";
import { Component, Prop, Vue } from "vue-property-decorator";
import fetch from "node-fetch";

@Component
export default class HelloWorld extends Vue {
  @Prop()
  private msg!: string;
  private loading: boolean = false;
  private result: Game[] = [];

  public created() {
    this.fetchData();
  }

  public async fetchData() {
    this.loading = true;

    const result = await games.getAllGames();
    this.loading = false;
    this.result = result.xcis;
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
</style>
