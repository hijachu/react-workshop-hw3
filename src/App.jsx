import { useState, useEffect } from 'react'
import 'bootstrap/scss/bootstrap.scss'
import axios from 'axios';

const api_server = 'https://todolist-api.hexschool.io';

function Register () {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [result, setResult] = useState('')

  const register = async () => {
    try {
      const response = await axios.post(
        `${api_server}/users/sign_up`,
        {
          email,
          password,
          nickname,
        }
      );

      setResult(`Register Successful. UID: ${response.data.uid}`);

    } catch (error) {
      setResult(`Register Failed: ${error.message}`);
    }
  };

  return (<>
    <h2>註冊</h2>
    <input type="text" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
    <input type="text" placeholder="Nickname" value={nickname} onChange={e => setNickname(e.target.value)} />
    <button onClick={register}>Sign Up</button>
    <p>{result}</p>
  </>)
}

function Login () {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')

  const login = async () => {
    try {
      const response = await axios.post(
        `${api_server}/users/sign_in`,
        {
          email,
          password
        }
      );
      // console.log(response);
      setToken(response.data.token)

    } catch (error) {
      setToken(`Login Failed: ${error.message}`);
    }
  }

  return (<>
    <h2>登入</h2>
    <input type="text" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
    <button onClick={login}>Sign In</button>
    <p>Token: {token}</p>
  </>)
}

function Validation({token, setToken}) {
  const [result, setResult] = useState('')

  const validate = async () => {
    // 設定 Token 儲存到 cookie，到期日為明天
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    document.cookie = `hexschoolTodo=${token}; expires=${tomorrow.toUTCString()}`;

    console.log(
      document.cookie
        .split('; ')
        .find((row) => row.startsWith('hexschoolTodo')),
    );

    try {
      const response = await axios.get(
        `${api_server}/users/checkout`,
        {
          headers: {
            authorization: token
          }
        }
      );

      setResult(`UID: ${response.data.uid}`)

    } catch (error) {
      setResult(`Validate Failed: ${error.message}`);
    }
  }

  return (<>
    <h2>驗證</h2>
    <input type="text" placeholder="Token" value={token} onChange={e => setToken(e.target.value)} />
    <button onClick={validate}>Check Out</button>
    <p>{result}</p>
  </>)
}

function Logout() {
  const [token, setToken] = useState('')
  const [result, setResult] = useState('')

  const logout = async () => {
    try {
      const response = await axios.post(
        `${api_server}/users/sign_out`,
        {},
        {
          headers: {
            authorization: token
          }
        }
      );

      // console.log(response);
      setResult(response.data.message)

    } catch (error) {
      setResult(`Logout Failed: ${error.message}`);
    }
  }

  return (<>
    <h2>登出</h2>
    <input type="text" placeholder="Token" value={token} onChange={e => setToken(e.target.value)} />
    <button onClick={logout}>Sign Out</button>
    <p>{result}</p>
  </>)
}

function TodoList({token}) {
  const [todoList, setTodoList] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [todoEdit, setTodoEdit] = useState({})

  const getTodoList = async () => {
    const response = await axios.get(
      `${api_server}/todos`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    setTodoList(response.data.data);
  };

  const addNewTodo = async () => {
    if (!newTodo) return;

    const todo = {
      content: newTodo,
    };

    await axios.post(
      `${api_server}/todos`,
      todo,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    setNewTodo('');

    getTodoList();
  };

  const deleteTodo = async (id) => {
    await axios.delete(
      `${api_server}/todos/${id}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    getTodoList();
  };

  const updateTodo = async (id) => {
    const todo = todoList.find((todo) => todo.id === id);
    todo.content = todoEdit[id]

    await axios.put(
      `${api_server}/todos/${id}`,
      todo,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    getTodoList();

    setTodoEdit({
      ...todoEdit,
      [id]: ''
    })
  };

  const toggleStatus = async (id) => {
    await axios.patch(
      `${api_server}/todos/${id}/toggle`,
      {},
      {
        headers: {
          Authorization: token,
        },
      },
    );

    getTodoList();
  };

  useEffect(() => {
    if (token)
      getTodoList();
  }, []);

  return (<>
    <h2>Todo List</h2>
    <input type="text" placeholder="New Todo" value={newTodo} onChange={e => setNewTodo(e.target.value)} />
    <button onClick={addNewTodo}>Add Todo</button>
    {
      token &&
        <ul>
          {
            todoList.map((todo, index) => <li key={index}>
              {todo.content}
              {todo.status ? '完成' : '未完成'} | {todoEdit[todo.id]}
              <input type="text" placeholder='更新值' onChange={
                (e) => {
                  const newTodoEdit = {
                    ...todoEdit
                  }
                  newTodoEdit[todo.id] = e.target.value
                  setTodoEdit(newTodoEdit)
                }
              } />
              <button onClick={() => deleteTodo(todo.id)}>Delete</button>
              <button onClick={() => updateTodo(todo.id)}>Update</button>
              <button onClick={() => toggleStatus(todo.id)}>Toggle Status</button>
            </li>)
          }
        </ul>
    }
  </>)
}

function App() {
  const [token, setToken] = useState('');

  const CookieToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('hexschoolTodo='))
    ?.split('=')[1];

  useEffect(() => {
    if (CookieToken) {
      setToken(CookieToken);
    }
  }, []);

  return (
    <>
      <h1>第三周作業 (AJAX API)</h1>
      <hr />

      <Register />
      <Login />
      <Validation token={token} setToken={setToken} />
      <Logout />

      <hr />
      <TodoList token={token} />
    </>
  )
}

export default App
