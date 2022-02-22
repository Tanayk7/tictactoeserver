import {v4 as uuid} from 'uuid';
import { WebSocket } from "ws";
import { config } from './config';

export interface Player{
    name: string;
    id: string;
    socket?: WebSocket
}

export class Game{
    id: string;
    creator: Player;
    players: Array<Player>;
    spectators?: Array<Player>;
    state: Array<any>;
    maxPlayers: number;
    gameStarted: boolean;
    gameOver: boolean;
    currentPlayer: number;
    winner: Player;
    movesLeft: number;
    draw: boolean;

    constructor(creator: Player){
        this.id = uuid();
        this.maxPlayers = 2;
        this.creator = creator;
        this.players = [creator];
        this.spectators = [];
        this.state = new Array(9).fill(0);
        this.gameStarted = false;
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null as any;
        this.movesLeft = 9;
        this.draw = false;
    }
    
    waitingForPlayer() : boolean {
        return this.players.length !== this.maxPlayers;
    }

    getId() : string{
        return this.id;
    }

    getCreator() : Player{
        return this.creator;
    }

    addSpectator(spectator: Player) : void { 
        this.spectators!.push(spectator);
    }

    removeSpectator(id: string) : Player { 
        let index = this.spectators!.findIndex(spectator => spectator.id === id);
        let removed = this.spectators!.splice(index, 1) as any;

        return removed;
    }

    addPlayer(player: Player) : void {
        this.players.push(player);
    }

    removePlayer(id: string) : Player {
        let index = this.players.findIndex(player => player.id === id);
        let removed = this.players.splice(index,1) as any;

        return removed;
    }

    startGame() : void {
        this.gameStarted = true;
    }

    endGame() : void {
        this.gameOver = true;
    }

    updateState(cell: number, player_num: number) : void {
        // @ts-ignore
        this.state[cell - 1] = config[`SYM_PLAYER_${player_num}`];
    }

    processMove(cell: number) : void {        
        this.movesLeft--;

        if(!this.gameStarted){
            this.startGame();
        }

        // update state of game 
        this.updateState(cell, this.currentPlayer);

        if(this.checkWin()){
            this.endGame();            
        }

        if(this.currentPlayer === 1){
            this.currentPlayer = 2;
        } else{
            this.currentPlayer = 1;
        }
    }

    checkWin(): boolean{
        if( this.state[0] !== 0 && this.state[0] === this.state[1] && this.state[1] === this.state[2] || 
            this.state[3] !== 0 && this.state[3] === this.state[4] && this.state[4] === this.state[5] ||
            this.state[6] !== 0 && this.state[6] === this.state[7] && this.state[7] === this.state[8] || 
            this.state[0] !== 0 && this.state[0] === this.state[3] && this.state[3] === this.state[6] ||
            this.state[1] !== 0 && this.state[1] === this.state[4] && this.state[4] === this.state[7] || 
            this.state[2] !== 0 && this.state[2] === this.state[5] && this.state[5] === this.state[8] || 
            this.state[0] !== 0 && this.state[0] === this.state[4] && this.state[4] === this.state[8] || 
            this.state[2] !== 0 && this.state[2] === this.state[4] && this.state[4] === this.state[6] 
        ){
            this.winner = this.players[this.currentPlayer - 1];
            return true;
        }
        else if(this.movesLeft === 0){
            this.draw = true;
            return false;
        }
        
        return false;
    }

    toString(){
        return `
            Game ID             : ${this.id}
            Players             : ${this.players.map(player => player.name).join(", ")}
            Game Creator        : ${this.creator}
        `
    }

    board(){
        return `
            ${this.state[0] ? '_' + this.state[0] + '_' : '___'}|${this.state[1] ? '_' + this.state[1] + '_' : '___'}|${this.state[2] ? '_' + this.state[2] + '_' : '___'}
            ${this.state[3] ? '_' + this.state[3] + '_' : '___'}|${this.state[4] ? '_' + this.state[4] + '_' : '___'}|${this.state[5] ? '_' + this.state[5] + '_' : '___'}
            ${this.state[6] ? ' ' + this.state[6] + ' ' : '   '}|${this.state[7] ? ' ' + this.state[7] + ' ' : '   '}|${this.state[8] ? ' ' + this.state[8] + ' ' : '   '}
        `
    }
}