
import * as anchor from '@project-serum/anchor'
import { useEffect, useMemo, useState } from 'react'
import { TODO_PROGRAM_PUBKEY } from '../constants'
import todoIDL from '../constants/todo.json'
import toast from 'react-hot-toast'
import { SystemProgram } from '@solana/web3.js'
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey'
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { authorFilter } from '../utils'
import { set } from '@project-serum/anchor/dist/cjs/utils/features'


export function useTodo() {
    const { connection } = useConnection()
    const { publicKey } = useWallet()
    const anchorWallet = useAnchorWallet()

    const [initialized, setInitialized] = useState(false)
    const [lastTodo, setLastTodo] = useState(0)
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(false)
    const [transactionPending, setTransactionPending] = useState(false)
    const [input, setInput] = useState("")


    const program = useMemo(() => {
        if (anchorWallet) {
            const provider = new anchor.AnchorProvider(connection, anchorWallet, anchor.AnchorProvider.defaultOptions())
            return new anchor.Program(todoIDL, TODO_PROGRAM_PUBKEY, provider)
        }
    }, [connection, anchorWallet])

    useEffect(() => {
        //Fetch userprofile if there is a profile then get its TodoAccounts
        const findProfileAccounts = async () => {
            if(program && publicKey && !transactionPending) {
                try {
                    setLoading(true);
                    const [profilePda , profileBump] = await findProgramAddressSync([utf8.encode("USER_STATE"), publicKey.toBuffer()], program.programId);
                    const profileAccount = await program.account.userState.fetch(profilePda);

                    if(profileAccount){
                        setLastTodo(profileAccount.lastTodo);
                        setInitialized(true);

                        const todoAccounts = await program.account.todoAccount.all([authorFilter(publicKey.toString())]);
                        setTodos(todoAccounts);
                    }else{
                        console.log("No profile found")
                        setInitialized(false);
                    }

                } catch (error) {
                    console.log(error);
                    setInitialized(false);
                    setTodos([])
                }finally{
                    setLoading(false);
                }
            }
        }
        findProfileAccounts()
    }, [publicKey, program, transactionPending]);

    const handleChange = (e)=> {
        setInput(e.target.value)
    }

    const initializeUser = async () => {
        if(program && publicKey && !transactionPending) {
            try {
                setTransactionPending(true)
                const [profilePda , profileBump] = await findProgramAddressSync([utf8.encode("USER_STATE"), publicKey.toBuffer()], program.programId);
                const tx = await program.methods
                .initializeUser()
                .accounts({
                    userProfile: profilePda,
                    authority : publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()

                setInitialized(true);
                toast.success("User initialized successfully");
            } catch (error) {
                console.log(error);
                toast.error("User initialization failed");
            }finally{
                setTransactionPending(false);
            }
        }
    }
  
    const initializeStaticUser = () => {
        setInitialized(true)
    }

    const addTodo = async (e) => {
        e.preventDefault();
        if(program && publicKey) {
            try {
                setTransactionPending(true)
                const [profilePda , profileBump] = await findProgramAddressSync([utf8.encode("USER_STATE"), publicKey.toBuffer()], program.programId);
                const [todoPda, todoBump] = await findProgramAddressSync([utf8.encode("TODO_STATE"), publicKey.toBuffer(), Buffer.Uint8Array.from([lastTodo])], program.programId);

                if(input){
                    await program.methods
                    .addTodo(input)
                    .accounts({
                        userProfile: profilePda,
                        todoAccount: todoPda,
                        authority: publicKey,
                        systemProgram: SystemProgram.programId, 
                    })
                    .rpc()
                    toast.success("Todo added successfully");
                } 
            } catch (error) {
                console.log(error);
                toast.error(error.toString());
            } finally {
                setTransactionPending(false);
                setInput("");
            }
        }
    }

    const markTodo = async (todoPda, todoIdx) => {
        if(program && publicKey) {
            try {
                setTransactionPending(true)
                setLoading(true)
                const [profilePda , profileBump] = await findProgramAddressSync([utf8.encode("USER_STATE"), publicKey.toBuffer()], program.programId);
                await program.methods
                .markTodo(todoIdx)
                .accounts({
                    userProfile: profilePda,
                    todoAccount: todoPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()
                toast.success("Todo marked successfully");
            } catch (error) {
                console.log(error);
                toast.error(error.toString());
            } finally {
                setLoading(false);
                setTransactionPending(false);
            }
        }
    }

   
    const removeTodo = async (todoPda, todoIdx) => {
        if(program && publicKey) {
            try {
                setTransactionPending(true);
                setLoading(true);
                const [profilePda , profileBump] = await findProgramAddressSync([utf8.encode("USER_STATE"), publicKey.toBuffer()], program.programId);
                await program.methods
                .removeTodo(todoIdx)
                .accounts({
                    userProfile: profilePda,
                    todoAccount: todoPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()
                toast.success("Todo removed successfully");
            } catch (error) {
                console.log(error);
                toast.error(error.toString());
            } finally {
                setLoading(false);
                setTransactionPending(false);
            }
        }
    }

    
    const incompleteTodos = useMemo(() => todos.filter((todo) => !todo.account.marked), [todos])
    const completedTodos = useMemo(() => todos.filter((todo) => todo.account.marked), [todos])

    return { initialized ,initializeUser, loading, transactionPending, completedTodos, incompleteTodos, input, setInput, handleChange , addTodo , markTodo , removeTodo }
}
