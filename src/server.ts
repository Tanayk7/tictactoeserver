import { WebSocket, Server } from "ws";
import { baseEvent, Events } from "../events/events";
import { Game, Player } from './game';
import {v4 as uuid} from 'uuid';
import { config } from './config';
import url from 'url';
import { 
    ClientConnectedEvent, 
    CreateGameEvent, 
    GameCreatedEvent, 
    GameLimitReachedEvent, 
    GameListEvent, 
    NameNotUniqueEvent, 
    JoinGameRequestEvent, 
    PlayerDisconnectedEvent, 
    SpectateGameRequestEvent,
    JoinGameEvent,
    SpectateGameEvent,
    PlayerConnectedEvent,
    GameUpdateEvent,
    UpdateGameEvent,
    SpectateListEvent
} from "../events";

const PORT = 3000;

export class GameServer{
    users: Array<Player>;
    games: Array<Game>;
    server!: Server;

    constructor(){
        this.games = [];
        this.initServer(); 
        this.users = [];
    }

    initServer(){
        this.server = new Server({ port: PORT }, () => console.log("Server started!"));

        this.server.on('connection', (ws: WebSocket, req: any) => {
            this.handleConnectionRequest(ws,req);
            ws.on('message', (event: string) => this.handleEvents(ws, JSON.parse(event) as baseEvent));
        });

        this.server.on('listening', () => { 
            console.log(`Server listening on port ${PORT}`)
        })
    }

    handleEvents(ws: WebSocket, event: baseEvent){
        switch(event.event){
            case Events.CREATE_GAME: 
                this.createGame(ws, event as CreateGameEvent);
                break;

            case Events.JOIN_GAME_REQUEST: 
                this.joinGameRequest(ws, event as JoinGameRequestEvent);
                break;

            case Events.SPECTATE_GAME_REQUEST:
                this.spectateGameRequest(ws, event as SpectateGameRequestEvent);
                break;

            case Events.PLAYER_DISCONNECTED:
                this.playerDisconnected(ws, event as PlayerDisconnectedEvent);
                break;

            case Events.JOIN_GAME: 
                this.joinGame(ws, event as JoinGameEvent);
                break;

            case Events.SPECTATE_GAME: 
                this.spectateGame(ws, event as SpectateGameEvent);
                break;

            case Events.UPDATE_GAME: 
                this.updateGame(ws, event as UpdateGameEvent);

            default: 
                break;
        }
    }

    handleConnectionRequest(ws: WebSocket,req: any){
        const { name } = url.parse(req.url!, true).query as any;

        if(this.users.find(user => user.name === name)){
            const nameNotUniqueEvent : NameNotUniqueEvent = {
                event: Events.NAME_NOT_UNIQUE,
                data: {
                    message:"This name already exists. Closing connection to server."
                }
            };

            ws.send(JSON.stringify(nameNotUniqueEvent));
            ws.close();
        }
        else{
            let new_user: Player = {
                name,
                id: uuid(),
                socket: ws
            }

            this.users.push(new_user);

            const clientConnectedEvent : ClientConnectedEvent = {
                event: Events.CLIENT_CONNECTED,
                data: {
                    id: new_user.id,
                    name: new_user.name,
                    message: `Welcome to tic tac toe online ${name}`,
                }
            };
            
            ws.send(JSON.stringify(clientConnectedEvent));  
        }
    }

    createGame(ws: WebSocket, event: CreateGameEvent){
        console.log(`${event.data.creator.name} wants to create a new game!`);
        let creator = this.users.find(user => user.name === event.data.creator.name);

        if(this.games.length !== config.MAX_GAMES){
            const game = new Game(creator!);

            this.games.push(game);

            console.log("Game created: ", game.toString());

            const gameCreatedEvent: GameCreatedEvent = { 
                event: Events.GAME_CREATED,
                data: {
                    message: `Created a new game with id ${game.getId()}
                    ${game.getCreator().name} added as Player 1 \n
                    Waiting for player 2 to join the game...
                    `
                }
            };

            ws.send(JSON.stringify(gameCreatedEvent));
        }
        else{
            const gameLimitReachedEvent: GameLimitReachedEvent = { 
                event: Events.GAME_LIMIT_REACHED,
                data: {
                    message: "Sorry maximum number of active games have been reached. Please join an existing game or try again later."
                }
            }
            
            ws.send(JSON.stringify(gameLimitReachedEvent));
            ws.close();
        }
    }   

    joinGameRequest(ws: WebSocket, event: JoinGameRequestEvent){
        console.log(`${event.data.player.name} wants to join an existing game`);

        let uuids = [];

        for(let game of this.games){
            if(game.waitingForPlayer()){
                uuids.push(game.getId());
            }
        }

        const gameListEvent: GameListEvent = { 
            event: Events.GAME_LIST,
            data: {
                games: uuids
            }
        };

        ws.send(JSON.stringify(gameListEvent));
    }

    joinGame(ws: WebSocket, event: JoinGameEvent){
        let { game: game_id } = event.data;
        let player_2 = this.users.find(user => user.name === event.data.player.name);
        let target_game = this.games.find(game => game.getId() === game_id);

        if(target_game!.waitingForPlayer()){
            target_game!.addPlayer(player_2!);

            const playerConnectedEvent: PlayerConnectedEvent = {
                event: Events.PLAYER_CONNECTED,
                data: {
                    player: { name: player_2!.name, id: player_2!.id }
                }
            }

            const gameUpdateEvent: GameUpdateEvent = { 
                event: Events.GAME_UPDATE,
                data: {
                    game_id: target_game!.getId(),
                    output: 'Player 1 plays - \n' + target_game!.board(),
                    turn: target_game!.creator.id
                }
            }

            for(let player of target_game!.players){
                player.socket!.send(JSON.stringify(playerConnectedEvent));
                player.socket!.send(JSON.stringify(gameUpdateEvent));
            }

            console.log("Sent game update events!!");
        }
        else{
            ws.send(JSON.stringify({ event: "GAME_FULL_EVENT", data: { message: "Sorry this game is already full" }}));
        }
    }

    spectateGameRequest(ws: WebSocket, event: SpectateGameRequestEvent){
        console.log(`${event.data.spectator.name} wants to watch a game`);

        let uuids = [];

        for(let game of this.games){
            if(!game.waitingForPlayer()){
                uuids.push(game.getId());
            }
        }

        const spectateListEvent: SpectateListEvent = { 
            event: Events.SPECTATE_LIST,
            data: {
                games: uuids
            }
        };

        ws.send(JSON.stringify(spectateListEvent));
    }

    updateGame(ws: WebSocket, event: UpdateGameEvent){
        const { game_id, cell } = event.data;

        const target_game = this.games.find(game => game.getId() === game_id);

        if(target_game){
            // if the position is already filled 
            if(target_game.state[cell - 1] !== 0){
                const gameUpdateEvent: GameUpdateEvent = { 
                    event: Events.GAME_UPDATE,
                    data: {
                        game_id,
                        output: `Position ${cell} is already taken. Please choose another position.`,
                        bad_position: true
                    }
                }

                ws.send(JSON.stringify(gameUpdateEvent));
                return;
            }

            target_game.processMove(cell);
            
            // If the game has been won by a player 
            if(target_game.winner){
                const gameUpdateEvent: GameUpdateEvent = { 
                    event: Events.GAME_UPDATE,
                    data: {
                        game_id,
                        output: `Game won by ${target_game.winner.name}!`,
                        win: true
                    }
                }
    
                for(let player of target_game.players){
                    let target_player_index = this.users.findIndex(user => user.id === player.id);
                    this.users.splice(target_player_index, 1);

                    player.socket!.send(JSON.stringify(gameUpdateEvent));
                    player.socket!.close();
                }

                for(let spectator of target_game.spectators!){
                    let target_spectator_index = this.users.findIndex(user => user.id === spectator.id);
                    this.users.splice(target_spectator_index, 1);

                    spectator.socket!.send(JSON.stringify(gameUpdateEvent));
                    spectator.socket!.close();
                }

                let target_index = this.games.findIndex(game => game.getId() === game_id);
                this.games.splice(target_index, 1);
            }
            // If the game is a draw
            else if(target_game.draw){
                const gameUpdateEvent: GameUpdateEvent = { 
                    event: Events.GAME_UPDATE,
                    data: { 
                        game_id,
                        output: "Its a draw!",
                        draw: true
                    }
                }

                for(let player of target_game!.players){
                    let user_index = this.users.findIndex(user => user.id === player.id);
                    this.users.splice(user_index, 1);

                    player.socket!.send(JSON.stringify(gameUpdateEvent));
                    player.socket!.close();
                }

                for(let spectator of target_game.spectators!){
                    let target_spectator_index = this.users.findIndex(user => user.id === spectator.id);
                    this.users.splice(target_spectator_index, 1);

                    spectator.socket!.send(JSON.stringify(gameUpdateEvent));
                    spectator.socket!.close();
                }

                // delete the game
                let target_index = this.games.findIndex(game => game.getId() === game_id);
                this.games.splice(target_index, 1);
            }
            else{
                const gameUpdateEvent: GameUpdateEvent = { 
                    event: Events.GAME_UPDATE,
                    data: {
                        game_id,
                        output: `Player ${target_game.currentPlayer} plays` + target_game.board(),
                        turn: target_game.players[target_game.currentPlayer - 1].id
                    }
                }
    
                for(let player of target_game!.players){
                    player.socket!.send(JSON.stringify(gameUpdateEvent));
                }

                for(let spectator of target_game.spectators!){
                    spectator.socket!.send(JSON.stringify(gameUpdateEvent));
                }
            }
           
        }
    }

    spectateGame(ws: WebSocket, event: SpectateGameEvent){
        let { game: game_id, player } = event.data;

        let target_game = this.games.find(game => game.getId() === game_id);
        let target_player = this.users.find(user => user.id === player.id);

        if(target_game){
            target_game.addSpectator(target_player!);

            const gameUpdateEvent: GameUpdateEvent = { 
                event: Events.GAME_UPDATE,
                data: {
                    output: `You watching the game between ${target_game.players[0].name} and ${target_game.players[1].name} \n` + target_game.board(),
                    game_id: target_game.id
                }
            }

            ws.send(JSON.stringify(gameUpdateEvent));
        }
    }   

    playerDisconnected(ws: WebSocket, event: PlayerDisconnectedEvent){
        console.log(`Player ${event.data.player.name} disconnected from the server`);

        const { player } = event.data;
        const target_game = this.games.find(game => game.players.find(p => p.id === player.id))
        const target_game_id = this.games.findIndex(game => game.getId() === target_game!.getId());        

        // if the user is in a game 
        if(target_game){
            const players = [...target_game.players];
            const gameUpdateEvent: GameUpdateEvent = { 
                event: Events.GAME_UPDATE,
                data: {
                    game_id: target_game.id,
                    output: `Player ${player.name} has disconnected. Game has ended.`,
                    game_end: true
                }
            };

            for(let player of players){
                let user_index = this.users.findIndex(user => user.id === player.id);
                this.users.splice(user_index, 1);
            
                player.socket!.send(JSON.stringify(gameUpdateEvent));
                player.socket!.close();
            }

            for(let spectator of target_game.spectators!){
                let user_index = this.users.findIndex(user => user.id === spectator.id);
                this.users.splice(user_index, 1);

                spectator.socket!.send(JSON.stringify(gameUpdateEvent));
                spectator.socket!.close();
            }

            this.games.splice(target_game_id, 1);
        }else{
            const target_id = this.users.findIndex(user => user.id === player.id);

            this.users.splice(target_id,1);
            
            ws.close();
        }
    }
}