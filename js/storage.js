/* Guarda os dados no navegador (localStorage) para não perder ao recarregar */
const Store={
  key:'FoodSave:v1',
  load(){try{return JSON.parse(localStorage.getItem(this.key))}catch{return null}},
  save(estado){try{localStorage.setItem(this.key,JSON.stringify(estado))}catch{}},
  getTheme(){try{return localStorage.getItem('sobraboa:theme')}catch{return null}},
  setTheme(t){try{localStorage.setItem('sobraboa:theme',t)}catch{}},
  reset(){try{localStorage.removeItem(this.key)}catch{}}
};