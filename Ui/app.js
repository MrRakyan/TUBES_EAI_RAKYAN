// ================================
// GRAPHQL ENDPOINTS (From docker-compose.yml)
// ================================
const MOVIE_SERVICE_URL = 'http://localhost:5001/graphql';
const BOOKING_SERVICE_URL = 'http://localhost:5002/graphql';
const NOTIFICATION_SERVICE_URL = 'http://localhost:5003/graphql';
const USER_SERVICE_URL = 'http://localhost:5004/graphql';
const WALLET_SERVICE_URL = 'http://localhost:5005/graphql';
const PAYMENT_GATEWAY_SERVICE_URL = 'http://localhost:5006/graphql';
const PAYMENT_TRANSACTION_SERVICE_URL = 'http://localhost:5007/graphql';
const HISTORY_PAYMENT_SERVICE_URL = 'http://localhost:5008/graphql';

// ================================
// HELPER FUNCTION FOR GRAPHQL FETCH
// ================================
async function graphqlFetch(url, query, variables = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

// ================================
// PAGE DETECTION AND INITIALIZATION
// ================================
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('movie.html')) {
    initMoviePage();
  } else if (path.includes('user.html')) {
    initUserPage();
  } else if (path.includes('booking.html')) {
    initBookingPage();
  } else if (path.includes('wallet.html')) {
    initWalletPage();
  } else if (path.includes('payment.html')) {
    initPaymentPage();
  } else if (path.includes('gateway.html')) {
    initGatewayPage();
  } else if (path.includes('notification.html')) {
    initNotificationPage();
  } else if (path.includes('history.html')) {
    initHistoryPage();
  }
});

// ================================
// MOVIE SERVICE FUNCTIONS (movie.html)
// ================================
function initMoviePage() {
  fetchMovies();
  const form = document.getElementById('addMovieForm');
  if (form) form.addEventListener('submit', handleAddMovie);
}

async function fetchMovies() {
  try {
    const query = `
      query {
        movies {
          id
          title
          genre
          duration
          rating
          price
        }
      }
    `;
    const result = await graphqlFetch(MOVIE_SERVICE_URL, query);
    console.log('Movies fetched:', result.data?.movies);
    renderMovies(result.data?.movies || []);
  } catch (error) {
    console.error('Error fetching movies:', error);
    renderMovies([]);
  }
}

async function fetchMoviesForBooking() {
  try {
    const query = `
      query {
        movies {
          id
          title
          genre
          duration
          rating
          price
        }
      }
    `;
    const result = await graphqlFetch(MOVIE_SERVICE_URL, query);
    console.log('Movies fetched for booking:', result.data?.movies);
    renderMoviesForBooking(result.data?.movies || []);
  } catch (error) {
    console.error('Error fetching movies for booking:', error);
    alert('Error loading movies: ' + error.message + '. Make sure the Movie service is running.');
    renderMoviesForBooking([]);
  }
}

function renderMovies(movies) {
  const container = document.getElementById('movie-list');
  if (!container) return;
  container.innerHTML = '';
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <h3>${movie.title}</h3>
      <p><strong>ID:</strong> ${movie.id}</p>
      <p><strong>Genre:</strong> ${movie.genre}</p>
      <p><strong>Duration:</strong> ${movie.duration} min</p>
      <p><strong>Rating:</strong> ${movie.rating}/10</p>
      <p><strong>Price:</strong> $${movie.price}</p>
    `;
    container.appendChild(card);
  });
}

function renderMoviesForBooking(movies) {
  const container = document.getElementById('movie-list');
  if (!container) return;
  container.innerHTML = '';
  if (movies.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No movies available. Add some movies first in the Movie Service.</p>';
    return;
  }
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <h3>${movie.title}</h3>
      <p class="movie-id">ID: ${movie.id}</p>
      <p><strong>Genre:</strong> ${movie.genre}</p>
      <p><strong>Duration:</strong> ${movie.duration} min</p>
      <p><strong>Rating:</strong> ${movie.rating}/10</p>
      <p><strong>Price:</strong> $${movie.price}</p>
    `;
    container.appendChild(card);
  });

  // Populate movie select
  const select = document.getElementById('movieSelect');
  select.innerHTML = '<option value="">Select Movie</option>';
  movies.forEach(movie => {
    const option = document.createElement('option');
    option.value = movie.id;
    option.textContent = `${movie.title} (ID: ${movie.id})`;
    select.appendChild(option);
  });

  // Restore selected movie from localStorage and auto-render chart
  const selectedMovie = localStorage.getItem('selectedMovie');
  if (selectedMovie) {
    select.value = selectedMovie;
    // Trigger lifecycle normal via event change
    select.dispatchEvent(new Event('change'));
  }
}

async function handleAddMovie(event) {
  event.preventDefault();
  const title = document.getElementById('title').value;
  const genre = document.getElementById('genre').value;
  const duration = parseInt(document.getElementById('duration').value);
  const rating = parseFloat(document.getElementById('rating').value);
  const price = parseInt(document.getElementById('price').value);

  const query = `
    mutation ($title: String!, $genre: String!, $duration: Int!, $rating: Float!, $price: Int!) {
      addMovie(title: $title, genre: $genre, duration: $duration, rating: $rating, price: $price) {
        id
        title
      }
    }
  `;
  const result = await graphqlFetch(MOVIE_SERVICE_URL, query, { title, genre, duration, rating, price });
  if (result.data) {
    alert('Movie added successfully!');
    fetchMovies(); // Refresh list
  } else {
    alert('Error adding movie');
  }
}

// ================================
// USER SERVICE FUNCTIONS (user.html)
// ================================
function initUserPage() {
  fetchUsers();
  const form = document.getElementById('registerUserForm');
  if (form) form.addEventListener('submit', handleRegisterUser);
}

async function fetchUsers() {
  const query = `
    query {
      users {
        id
        name
        email
        phone
        createdAt
      }
    }
  `;
  const result = await graphqlFetch(USER_SERVICE_URL, query);
  renderUsers(result.data?.users || []);
}

function renderUsers(users) {
  const container = document.getElementById('user-list');
  if (!container) return;
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(user => `
          <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function handleRegisterUser(event) {
  event.preventDefault();
  const id = document.getElementById('userId').value;
  const name = document.getElementById('userName').value;
  const email = document.getElementById('userEmail').value;
  const phone = document.getElementById('userPhone').value;

  const query = `
    mutation ($id: String!, $name: String!, $email: String!, $phone: String) {
      createUser(id: $id, name: $name, email: $email, phone: $phone) {
        id
        name
        email
      }
    }
  `;
  const result = await graphqlFetch(USER_SERVICE_URL, query, { id, name, email, phone });
  if (result.data) {
    alert('User registered successfully!');
    fetchUsers(); // Refresh list
  } else {
    alert('Error registering user');
  }
}

// ================================
// BOOKING SERVICE FUNCTIONS (booking.html)
// ================================
function initBookingPage() {
  fetchMoviesForBooking();
  const form = document.getElementById('bookTicketForm');
  if (form) form.addEventListener('submit', handleBookTicket);
  const movieSelect = document.getElementById('movieSelect');
  if (movieSelect) movieSelect.addEventListener('change', handleMovieChange);
}

async function handleMovieChange() {
  const movieId = parseInt(document.getElementById('movieSelect').value);

  if (!movieId) {
    localStorage.removeItem('selectedMovie');
    document.getElementById('seating-chart').innerHTML = '';
    document.getElementById('booking-list').innerHTML = '';
    return;
  }

  localStorage.setItem('selectedMovie', movieId.toString());
  await fetchBookingsForMovie(movieId);
  await fetchBookingsForMovieList(movieId);
}

async function fetchBookingsForMovie(movieId) {
  try {
    const query = `
      query {
        bookings {
          movieId
          seatNumber
        }
      }
    `;
    const result = await graphqlFetch(BOOKING_SERVICE_URL, query);
    const allBookings = result.data?.bookings || [];
    const bookedSeats = allBookings.filter(b => b.movieId === movieId).map(b => b.seatNumber);
    renderSeatingChart(bookedSeats);
  } catch (error) {
    console.error('Error fetching bookings for movie:', error);
    alert('Error loading seating chart. Please refresh the page or try again.');
    // Optionally, render with empty booked seats or keep previous state
    renderSeatingChart([]);
  }
}

function renderSeatingChart(bookedSeats) {
  const chart = document.getElementById('seating-chart');
  chart.innerHTML = '<div class="screen">SCREEN</div><h3>Seating Chart</h3>';
  const rows = ['A', 'B', 'C', 'D'];
  const seatsPerRow = 5;
  rows.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'seat-row';
    for (let i = 1; i <= seatsPerRow; i++) {
      const seatNumber = row + i;
      const seatBtn = document.createElement('button');
      seatBtn.className = 'seat ' + (bookedSeats.includes(seatNumber) ? 'booked' : 'available');
      seatBtn.textContent = seatNumber;
      if (!bookedSeats.includes(seatNumber)) {
        seatBtn.onclick = () => selectSeat(seatBtn, seatNumber);
      }
      rowDiv.appendChild(seatBtn);
    }
    chart.appendChild(rowDiv);
  });
}

function selectSeat(seatBtn, seatNumber) {
  document.getElementById('seatNumber').value = seatNumber;
  // Update UI to show selected
  const seats = document.querySelectorAll('.seat');
  seats.forEach(seat => seat.classList.remove('selected'));
  seatBtn.classList.add('selected');
}

async function fetchBookingsForMovieList(movieId) {
  try {
    const query = `
      query {
        bookings {
          id
          userId
          movieId
          seatNumber
          totalPrice
          status
          movie {
            title
          }
        }
      }
    `;
    const result = await graphqlFetch(BOOKING_SERVICE_URL, query);
    const allBookings = result.data?.bookings || [];
    const movieBookings = allBookings.filter(b => b.movieId === movieId);
    renderBookingsForMovie(movieBookings);
  } catch (error) {
    console.error('Error fetching bookings for movie list:', error);
    alert('Error loading booking list. Please refresh the page or try again.');
    renderBookingsForMovie([]);
  }
}

function renderBookingsForMovie(bookings) {
  const container = document.getElementById('booking-list');
  if (!container) return;
  container.innerHTML = '';
  if (bookings.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No bookings for this movie yet.</p>';
    return;
  }
  bookings.forEach(booking => {
    const card = document.createElement('div');
    card.className = 'booking-card';
    const statusClass = booking.status.toLowerCase();
    card.innerHTML = `
      <h3>Booking #${booking.id}</h3>
      <p><strong>User ID:</strong> ${booking.userId}</p>
      <p><strong>Movie:</strong> ${booking.movie?.title || 'Unknown'}</p>
      <p><strong>Seat:</strong> ${booking.seatNumber}</p>
      <p><strong>Price:</strong> $${booking.totalPrice}</p>
      <span class="status ${statusClass}">${booking.status}</span>
    `;
    container.appendChild(card);
  });
}

async function handleBookTicket(event) {
  event.preventDefault();
  const submitBtn = document.querySelector('#bookTicketForm button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Booking...';

  const userId = document.getElementById('bookingUserId').value;
  const movieId = parseInt(document.getElementById('movieSelect').value);
  const seatNumber = document.getElementById('seatNumber').value;

  try {
    // Validation 1: Check if user exists
    const userQuery = `query { users { id } }`;
    const userResult = await graphqlFetch(USER_SERVICE_URL, userQuery);
    const userIds = userResult.data?.users?.map(u => u.id) || [];
    if (!userIds.includes(userId)) {
      alert('User ID does not exist. Please create the user first in user.html.');
      return;
    }

    // Validation 2: Check if movie exists
    const movieQuery = `query { movies { id } }`;
    const movieResult = await graphqlFetch(MOVIE_SERVICE_URL, movieQuery);
    const movieIds = movieResult.data?.movies?.map(m => m.id) || [];
    if (!movieIds.includes(movieId)) {
      alert('Movie ID does not exist. Please check available movies above.');
      return;
    }

    // Validation 3: Check if seat is already booked (double-check)
    const bookingQuery = `
      query {
        bookings {
          movieId
          seatNumber
        }
      }
    `;
    const bookingResult = await graphqlFetch(BOOKING_SERVICE_URL, bookingQuery);
    const allBookings = bookingResult.data?.bookings || [];
    const bookedSeats = allBookings.filter(b => b.movieId === movieId).map(b => b.seatNumber);
    if (bookedSeats.includes(seatNumber)) {
      alert('Seat number is already booked. Please choose another seat.');
      return;
    }

    // If all validations pass, proceed with booking
    const mutation = `
      mutation ($userId: String!, $movieId: Int!, $seatNumber: String!) {
        createBooking(userId: $userId, movieId: $movieId, seatNumber: $seatNumber) {
          id
          status
          totalPrice
        }
      }
    `;
    const result = await graphqlFetch(BOOKING_SERVICE_URL, mutation, { userId, movieId, seatNumber });
    if (result.data) {
      alert('Booking created successfully!');
      // Refresh seating chart and booking list
      await fetchBookingsForMovie(movieId);
      await fetchBookingsForMovieList(movieId);
      // Clear form
      document.getElementById('seatNumber').value = '';
    } else {
      alert('Error creating booking');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Book Ticket';
  }
}

// ================================
// WALLET SERVICE FUNCTIONS (wallet.html)
// ================================
function initWalletPage() {
  const createForm = document.getElementById('createWalletForm');
  if (createForm) createForm.addEventListener('submit', handleCreateWallet);
  const selectForm = document.getElementById('selectWalletForm');
  if (selectForm) selectForm.addEventListener('submit', handleLoadWallet);
}

async function handleCreateWallet(event) {
  event.preventDefault();
  const userId = document.getElementById('createUserId').value;

  const query = `
    mutation ($userId: String!) {
      createWallet(userId: $userId) {
        userId
        balance
      }
    }
  `;
  try {
    const result = await graphqlFetch(WALLET_SERVICE_URL, query, { userId });
    if (result.data) {
      alert('Wallet created successfully!');
    } else {
      alert('Error creating wallet');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function handleLoadWallet(event) {
  event.preventDefault();
  const userId = document.getElementById('selectUserId').value;
  await fetchWalletBalance(userId);
}

async function fetchWalletBalance(userId) {
  const query = `
    query ($userId: String!) {
      walletByUser(userId: $userId) {
        userId
        balance
      }
    }
  `;
  const result = await graphqlFetch(WALLET_SERVICE_URL, query, { userId });
  const balance = result.data?.walletByUser?.balance || 0;
  document.getElementById('wallet-balance').textContent = `Balance: $${balance}`;
}

// ================================
// PAYMENT TRANSACTION SERVICE FUNCTIONS (payment.html)
// ================================
function initPaymentPage() {
  fetchPaymentHistory();
  const form = document.getElementById('payBookingForm');
  if (form) form.addEventListener('submit', handlePayBooking);
}

async function fetchPaymentHistory() {
  const userId = document.getElementById('paymentUserId').value;
  if (!userId) return;
  const query = `
    query ($userId: String!) {
      transactionsByUser(userId: $userId) {
        id
        bookingId
        userId
        amount
        seatNumber
        status
        createdAt
      }
    }
  `;
  const result = await graphqlFetch(PAYMENT_TRANSACTION_SERVICE_URL, query, { userId });
  renderPaymentHistory(result.data?.transactionsByUser || []);
}

function renderPaymentHistory(transactions) {
  const container = document.getElementById('payment-history');
  if (!container) return;
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Booking ID</th>
          <th>User ID</th>
          <th>Amount</th>
          <th>Seat</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map(tx => `
          <tr>
            <td>${tx.id}</td>
            <td>${tx.bookingId}</td>
            <td>${tx.userId}</td>
            <td>$${tx.amount}</td>
            <td>${tx.seatNumber}</td>
            <td><span class="status ${tx.status.toLowerCase()}">${tx.status}</span></td>
            <td>${new Date(tx.createdAt).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function handlePayBooking(event) {
  event.preventDefault();
  const bookingId = parseInt(document.getElementById('payBookingId').value);
  const userId = document.getElementById('paymentUserId').value;

  try {
    // Step 1: Get booking details to know the amount
    const bookingQuery = `
      query {
        bookings {
          id
          userId
          totalPrice
          status
        }
      }
    `;
    const bookingResult = await graphqlFetch(BOOKING_SERVICE_URL, bookingQuery);
    const allBookings = bookingResult.data?.bookings || [];
    const booking = allBookings.find(b => b.id === bookingId);

    if (!booking) {
      alert('Booking ID not found.');
      return;
    }

    if (booking.userId !== userId) {
      alert('Booking does not belong to this user.');
      return;
    }

    if (booking.status !== 'PENDING') {
      alert(`Booking is already ${booking.status.toLowerCase()}. Cannot pay.`);
      return;
    }

    // Step 2: Get wallet balance
    const walletQuery = `
      query ($userId: String!) {
        walletByUser(userId: $userId) {
          userId
          balance
        }
      }
    `;
    const walletResult = await graphqlFetch(WALLET_SERVICE_URL, walletQuery, { userId });

    if (!walletResult.data?.walletByUser) {
      alert('Wallet not found. Please create a wallet first.');
      return;
    }

    const walletBalance = walletResult.data.walletByUser.balance;
    const bookingAmount = booking.totalPrice;

    // Step 3: Check if balance is sufficient
    if (walletBalance < bookingAmount) {
      alert(`Insufficient balance. Wallet: $${walletBalance}, Required: $${bookingAmount}`);
      return;
    }

    // Step 4: If sufficient, proceed with payment
    const paymentQuery = `
      mutation ($bookingId: Int!, $userId: String!) {
        payBooking(bookingId: $bookingId, userId: $userId) {
          id
          bookingId
          amount
          status
        }
      }
    `;
    const result = await graphqlFetch(PAYMENT_TRANSACTION_SERVICE_URL, paymentQuery, { bookingId, userId });

    if (result.errors) {
      alert('Payment error: ' + result.errors[0].message);
      return;
    }

    if (result.data) {
      alert('Payment successful!');
      fetchPaymentHistory(); // Refresh history
    } else {
      alert('Error processing payment');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// ================================
// PAYMENT GATEWAY SERVICE FUNCTIONS (gateway.html)
// ================================
function initGatewayPage() {
  const form = document.getElementById('topUpForm');
  if (form) form.addEventListener('submit', handleTopUp);
  const historyForm = document.getElementById('getTopUpTransactionsForm');
  if (historyForm) historyForm.addEventListener('submit', handleGetTopUpTransactions);
}

async function fetchGatewayLogs(userId) {
  if (!userId) return;
  const query = `
    query ($userId: String!) {
      topUpTransactionsByUser(userId: $userId) {
        id
        amount
        method
        status
        createdAt
      }
    }
  `;
  const result = await graphqlFetch(PAYMENT_GATEWAY_SERVICE_URL, query, { userId });
  renderGatewayLogs(result.data?.topUpTransactionsByUser || []);
}

function renderGatewayLogs(transactions) {
  const container = document.getElementById('gateway-transactions');
  if (!container) return;
  container.innerHTML = '';
  transactions.forEach(tx => {
    const item = document.createElement('div');
    item.className = 'transaction-item';
    item.innerHTML = `
      <h4>Top Up Transaction #${tx.id}</h4>
      <p><strong>Amount:</strong> $${tx.amount}</p>
      <p><strong>Method:</strong> ${tx.method}</p>
      <p><strong>Status:</strong> ${tx.status}</p>
      <small>${new Date(tx.createdAt).toLocaleString()}</small>
    `;
    container.appendChild(item);
  });
}

async function handleGetTopUpTransactions(event) {
  event.preventDefault();
  const userId = document.getElementById('topUpHistoryUserId').value;
  await fetchGatewayLogs(userId);
}

async function handleTopUp(event) {
  event.preventDefault();

  const userId = document.getElementById('topUpUserId').value;
  const amount = parseInt(document.getElementById('topUpAmount').value);
  const method = document.getElementById('topUpMethod').value;

  try {
    const walletQuery = `
      query ($userId: String!) {
        walletByUser(userId: $userId) {
          userId
          balance
        }
      }
    `;
    const walletResult = await graphqlFetch(WALLET_SERVICE_URL, walletQuery, { userId });

    if (walletResult.errors) {
      alert(walletResult.errors[0].message);
      return;
    }

    if (!walletResult.data?.walletByUser) {
      alert('Wallet not found. Please create a wallet first.');
      return;
    }

    const query = `
      mutation ($userId: String!, $amount: Int!, $method: PaymentMethod!) {
        topUpWallet(userId: $userId, amount: $amount, method: $method) {
          userId
          amount
          status
        }
      }
    `;

    const result = await graphqlFetch(PAYMENT_GATEWAY_SERVICE_URL, query, { userId, amount, method });

    if (result.errors) {
      alert(result.errors[0].message);
      return;
    }

    alert('Top Up Successful!');
    await fetchGatewayLogs(userId);

  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function handleProcessPayment(event) {
  event.preventDefault();
  const userId = document.getElementById('gatewayUserId').value;
  const amount = parseInt(document.getElementById('paymentAmount').value);
  const method = document.getElementById('paymentMethod').value;

  const query = `
    mutation ($userId: String!, $amount: Int!, $method: PaymentMethod!) {
      topUpWallet(userId: $userId, amount: $amount, method: $method) {
        id
        userId
        amount
        method
        status
      }
    }
  `;
  const result = await graphqlFetch(PAYMENT_GATEWAY_SERVICE_URL, query, { userId, amount, method });
  if (result.data) {
    alert('Payment processed successfully!');
    fetchGatewayLogs(); // Refresh logs
  } else {
    alert('Error processing payment');
  }
}

// ================================
// NOTIFICATION SERVICE FUNCTIONS (notification.html)
// ================================
function initNotificationPage() {
  const userForm = document.getElementById('getNotificationByUserForm');
  if (userForm) userForm.addEventListener('submit', handleGetNotificationByUser);
}

async function fetchNotifications() {
  const userId = document.getElementById('notificationUserId').value;
  if (!userId) return;
  const query = `
    query ($userId: String!) {
      notificationsByUser(userId: $userId) {
        id
        userId
        title
        message
        createdAt
      }
    }
  `;
  const result = await graphqlFetch(NOTIFICATION_SERVICE_URL, query, { userId });
  renderNotifications(result.data?.notificationsByUser || []);
}

function renderNotifications(notifications) {
  const container = document.getElementById('notification-list');
  if (!container) return;
  container.innerHTML = '';
  notifications.forEach(notif => {
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.innerHTML = `
      <h4>Notification for Booking ${notif.bookingId}</h4>
      <p><strong>User ID:</strong> ${notif.userId}</p>
      <p><strong>Message:</strong> ${notif.message}</p>
      <p><strong>Type:</strong> ${notif.type}</p>
    `;
    container.appendChild(item);
  });
}

async function handleGetNotificationByUser(event) {
  event.preventDefault();
  const userId = document.getElementById('notificationUserId').value;

  const query = `
    query ($userId: String!) {
      notificationsByUser(userId: $userId) {
        id
        bookingId
        userId
        message
        type
        createdAt
      }
    }
  `;
  const result = await graphqlFetch(NOTIFICATION_SERVICE_URL, query, { userId });
  const notifications = result.data?.notificationsByUser || [];
  if (notifications.length > 0) {
    renderNotifications(notifications);
  } else {
    alert('No notifications found for this user');
  }
}

// ================================
// HISTORY SERVICE FUNCTIONS (history.html)
// ================================
function initHistoryPage() {
  const userForm = document.getElementById('getPaymentHistoryByUserForm');
  if (userForm) userForm.addEventListener('submit', handleGetPaymentHistoryByUser);
}

async function fetchHistoryLogs() {
  const userId = document.getElementById('historyUserId').value;
  if (!userId) return;
  const query = `
    query ($userId: String!) {
      paymentHistoryByUser(userId: $userId) {
        id
        transactionId
        bookingId
        userId
        seatNumber
        amount
        method
        status
        createdAt
      }
    }
  `;
  const result = await graphqlFetch(HISTORY_PAYMENT_SERVICE_URL, query, { userId });
  renderHistoryLogs(result.data?.paymentHistoryByUser || []);
}

function renderHistoryLogs(logs) {
  const container = document.getElementById('payment-history-table');
  if (!container) return;
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Transaction ID</th>
          <th>Booking ID</th>
          <th>User ID</th>
          <th>Seat</th>
          <th>Amount</th>
          <th>Method</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${logs.map(log => `
          <tr>
            <td>${log.id}</td>
            <td>${log.transactionId}</td>
            <td>${log.bookingId}</td>
            <td>${log.userId}</td>
            <td>${log.seatNumber}</td>
            <td>$${log.amount}</td>
            <td>${log.method}</td>
            <td><span class="status ${log.status.toLowerCase()}">${log.status}</span></td>
            <td>${new Date(log.createdAt).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function handleGetPaymentHistoryByUser(event) {
  event.preventDefault();
  const userId = document.getElementById('historyUserId').value;
  const query = `
    query ($userId: String!) {
      paymentHistoryByUser(userId: $userId) {
        id
        transactionId
        bookingId
        userId
        seatNumber
        amount
        method
        status
        createdAt
      }
    }
  `;
  const result = await graphqlFetch(HISTORY_PAYMENT_SERVICE_URL, query, { userId });
  renderHistoryLogs(result.data?.paymentHistoryByUser || []);
}

async function handleGetPaymentHistoryByBooking(event) {
  event.preventDefault();
  const bookingId = parseInt(document.getElementById('historyBookingId').value);
  const query = `
    query ($bookingId: Int!) {
      paymentHistoryByBooking(bookingId: $bookingId) {
        id
        transactionId
        bookingId
        userId
        seatNumber
        amount
        method
        status
        createdAt
      }
    }
  `;
  const result = await graphqlFetch(HISTORY_PAYMENT_SERVICE_URL, query, { bookingId });
  renderHistoryLogs(result.data?.paymentHistoryByBooking || []);
}

async function handleGetPaymentHistoryById(event) {
  event.preventDefault();
  const id = parseInt(document.getElementById('historyId').value);
  const query = `
    query ($id: Int!) {
      paymentHistoryById(id: $id) {
        id
        transactionId
        bookingId
        userId
        seatNumber
        amount
        method
        status
        createdAt
      }
    }
  `;
  const result = await graphqlFetch(HISTORY_PAYMENT_SERVICE_URL, query, { id });
  renderHistoryLogs([result.data?.paymentHistoryById].filter(Boolean));
}
