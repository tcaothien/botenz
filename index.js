require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const User = require('./models/User');
const { mongoURI, token } = require('./config/config');

// Khởi tạo client Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Kết nối MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

// Khi bot đã sẵn sàng
client.once('ready', () => {
  console.log(`${client.user.tag} đã đăng nhập thành công!`);
});

// Lắng nghe tin nhắn
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Đảm bảo người dùng có tài khoản trong cơ sở dữ liệu
  let user = await User.findOne({ userId: message.author.id });
  if (!user) {
    user = new User({ userId: message.author.id });
    await user.save();
  }

  // Hiển thị số dư xu
  if (command === 'exu') {
    const embed = {
      title: "Số Dư Của Bạn",
      description: `Số dư của bạn là **${user.balance} xu**.`,
    };
    return message.channel.send({ embeds: [embed] });
  }

  // Nhận tiền hàng ngày
  if (command === 'edaily') {
    const dailyAmount = Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000;
    user.balance += dailyAmount;
    await user.save();

    const embed = {
      title: "Nhận Tiền Hàng Ngày",
      description: `Bạn đã nhận **${dailyAmount} xu**. Tổng số dư của bạn hiện tại là **${user.balance} xu**.`,
    };
    return message.channel.send({ embeds: [embed] });
  }

  // Chuyển tiền cho người khác
  if (command === 'egives') {
    const targetUser = message.mentions.users.first();
    const amount = parseInt(args[1]);
    if (!targetUser) return message.reply("Bạn cần chỉ định người nhận.");
    if (isNaN(amount) || amount <= 0) return message.reply("Vui lòng nhập số tiền hợp lệ.");

    if (user.balance < amount) return message.reply("Bạn không đủ tiền để chuyển.");

    let target = await User.findOne({ userId: targetUser.id });
    if (!target) {
      target = new User({ userId: targetUser.id });
      await target.save();
    }

    user.balance -= amount;
    target.balance += amount;

    await user.save();
    await target.save();

    const embed = {
      title: "Chuyển Tiền Thành Công",
      description: `Bạn đã chuyển **${amount} xu** cho <@${targetUser.id}>. Số dư hiện tại của bạn là **${user.balance} xu**.`,
    };
    message.channel.send({ embeds: [embed] });
  }

  // Kết hôn
  if (command === 'emarry') {
    if (args.length === 0) return message.reply("Bạn cần chỉ định người kết hôn.");

    const partner = message.mentions.users.first();
    if (!partner) return message.reply("Không tìm thấy người dùng để kết hôn.");

    if (user.marriedTo) return message.reply("Bạn đã kết hôn với ai đó rồi.");
    if (partner.id === message.author.id) return message.reply("Bạn không thể kết hôn với chính mình.");

    const partnerUser = await User.findOne({ userId: partner.id });
    if (!partnerUser) return message.reply("Người này không có tài khoản.");

    const weddingFee = 5000000;
    if (user.balance < weddingFee) return message.reply("Bạn không đủ tiền để kết hôn.");

    user.balance -= weddingFee;
    partnerUser.balance -= weddingFee;
    user.marriedTo = partner.id;
    partnerUser.marriedTo = message.author.id;

    await user.save();
    await partnerUser.save();

    const embed = {
      title: "Kết Hôn Thành Công",
      description: `Bạn và <@${partner.id}> đã kết hôn thành công! Chi phí kết hôn là **${weddingFee} xu**.`,
    };
    message.channel.send({ embeds: [embed] });
  }

  // Ly hôn
  if (command === 'edivorce') {
    if (!user.marriedTo) return message.reply("Bạn chưa kết hôn.");

    const partnerUser = await User.findOne({ userId: user.marriedTo });
    if (!partnerUser) return message.reply("Không tìm thấy thông tin người bạn đã kết hôn.");

    const divorceFee = 5000000;
    if (user.balance < divorceFee) return message.reply("Bạn không đủ tiền để ly hôn.");

    user.balance -= divorceFee;
    partnerUser.balance -= divorceFee;
    user.marriedTo = null;
    partnerUser.marriedTo = null;

    await user.save();
    await partnerUser.save();

    const embed = {
      title: "Ly Hôn Thành Công",
      description: `Bạn và <@${partnerUser.userId}> đã ly hôn thành công. Chi phí ly hôn là **${divorceFee} xu**.`,
    };
    message.channel.send({ embeds: [embed] });
  }

  // Gửi điểm yêu thương
  if (command === 'elove') {
    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply("Bạn cần chỉ định người nhận.");

    const oneHour = 60 * 60 * 1000; // 1 giờ
    const lastLove = user.lastLove ? new Date(user.lastLove) : null;
    if (lastLove && new Date() - lastLove < oneHour) {
      return message.reply("Bạn chỉ có thể gửi điểm yêu thương mỗi giờ một lần.");
    }

    user.lovePoints += 1;
    user.lastLove = new Date();
    await user.save();

    const embed = {
      title: "Gửi Điểm Yêu Thương",
      description: `Bạn đã gửi 1 điểm yêu thương cho <@${targetUser.id}>. Tổng điểm yêu thương của bạn là **${user.lovePoints}**.`,
    };
    message.channel.send({ embeds: [embed] });
  }

  // Trạng thái kết hôn và điểm yêu thương
  if (command === 'epmarry') {
    if (!user.marriedTo) return message.reply("Bạn chưa kết hôn.");
    const partnerUser = await User.findOne({ userId: user.marriedTo });
    if (!partnerUser) return message.reply("Không tìm thấy thông tin người bạn đã kết hôn.");

    const embed = {
      title: "Trạng Thái Kết Hôn",
      description: `Bạn và <@${partnerUser.userId}> đã kết hôn. Tổng điểm yêu thương của bạn là **${user.lovePoints}**.`,
    };
    message.channel.send({ embeds: [embed] });
  }

  // Tài xỉu (etx)
  if (command === 'etx') {
    const betAmount = parseInt(args[0]);
    if (isNaN(betAmount) || betAmount <= 0) return message.reply("Vui lòng nhập số tiền hợp lệ để đặt cược.");
    if (user.balance < betAmount) return message.reply("Bạn không đủ tiền để tham gia chơi tài xỉu.");

    const result = Math.random() < 0.5 ? 'Tài' : 'Xỉu';
    const outcome = Math.random() < 0.5 ? 'win' : 'lose';
    const winAmount = outcome === 'win' ? betAmount * 2 : 0;

    user.balance += (outcome === 'win' ? winAmount : -betAmount);
    await user.save();

    const embed = {
      title: "Tài Xỉu",
      description: `Bạn đặt cược **${betAmount} xu** vào **${result}**. Bạn đã **${outcome}** và hiện có **${user.balance} xu**.`,
    };
    message.channel.send({ embeds: [embed] });
  }

    // Cộng xu cho người dùng (chỉ admin)
    if (command === 'eaddxu') {
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return message.reply("Vui lòng nhập số tiền hợp lệ.");
      user.balance += amount;
      await user.save();
      return message.reply(`Đã cộng **${amount} xu** cho bạn. Số dư hiện tại là **${user.balance} xu**.`);
    }

    // Xóa xu của người dùng (chỉ admin)
    if (command === 'edelxu') {
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return message.reply("Vui lòng nhập số tiền hợp lệ.");
      if (user.balance < amount) return message.reply("Số dư của người dùng không đủ để xóa.");
      user.balance -= amount;
      await user.save();
      return message.reply(`Đã xóa **${amount} xu** khỏi tài khoản của bạn. Số dư hiện tại là **${user.balance} xu**.`);
    }

    // Thêm câu trả lời tự động (chỉ admin)
    if (command === 'eaddreply') {
      const keyword = args[0];
      const replyMessage = args.slice(1).join(" ");
      if (!keyword || !replyMessage) return message.reply("Vui lòng cung cấp từ khóa và câu trả lời.");
      
      // Lưu câu trả lời vào cơ sở dữ liệu (tạo model AutoReply trong MongoDB)
      // Chỉ admin mới có thể thêm câu trả lời tự động
      const AutoReply = mongoose.model('AutoReply', new mongoose.Schema({
        keyword: String,
        reply: String,
      }));
      const newReply = new AutoReply({ keyword, reply: replyMessage });
      await newReply.save();

      return message.reply(`Đã thêm câu trả lời tự động cho từ khóa **${keyword}**.`);
    }

    // Xóa câu trả lời tự động (chỉ admin)
    if (command === 'edelreply') {
      const keyword = args[0];
      if (!keyword) return message.reply("Vui lòng nhập từ khóa câu trả lời tự động cần xóa.");

      const AutoReply = mongoose.model('AutoReply', new mongoose.Schema({
        keyword: String,
        reply: String,
      }));
      const replyToDelete = await AutoReply.findOne({ keyword });

      if (!replyToDelete) return message.reply(`Không tìm thấy câu trả lời tự động cho từ khóa **${keyword}**.`);

      await replyToDelete.deleteOne();
      return message.reply(`Đã xóa câu trả lời tự động cho từ khóa **${keyword}**.`);
    }

    // Hiển thị danh sách câu trả lời tự động (chỉ admin)
    if (command === 'elistreply') {
      const AutoReply = mongoose.model('AutoReply', new mongoose.Schema({
        keyword: String,
        reply: String,
      }));
      const replies = await AutoReply.find();

      if (replies.length === 0) return message.reply("Không có câu trả lời tự động nào.");

      const replyList = replies.map((r, index) => `${index + 1}. **${r.keyword}**: ${r.reply}`).join("\n");

      const embed = {
        title: "Danh Sách Câu Trả Lời Tự Động",
        description: replyList,
      };
      return message.channel.send({ embeds: [embed] });
    }

    // Bảng xếp hạng tiền (hiển thị người dùng có số dư cao nhất)
    if (command === 'etop') {
      const users = await User.find().sort({ balance: -1 }).limit(10); // Lấy top 10 người dùng có số dư cao nhất
      if (users.length === 0) return message.reply("Không có người dùng nào.");

      const leaderboard = users.map((user, index) => `${index + 1}. <@${user.userId}>: ${user.balance} xu`).join("\n");

      const embed = {
        title: "Bảng Xếp Hạng Tiền",
        description: leaderboard,
      };
      return message.channel.send({ embeds: [embed] });
    }

    // Tạo câu trả lời tự động cho các câu hỏi
    if (command === 'ehelps') {
      const embed = {
        title: "Danh Sách Lệnh Bot",
        description: `
          **ehelp** - Hiển thị danh sách các lệnh.
          **exu** - Hiển thị số dư xu của bạn.
          **edaily** - Nhận tiền hàng ngày (ngẫu nhiên từ 10,000 đến 50,000 xu).
          **egives @user <số tiền>** - Chuyển tiền cho người khác.
          **emarry @user** - Kết hôn với người khác (phí kết hôn là 5 triệu xu).
          **edivorce** - Ly hôn (phí ly hôn là 5 triệu xu).
          **elove @user** - Gửi điểm yêu thương cho người khác (1 điểm/giờ).
          **epmarry** - Hiển thị trạng thái kết hôn và điểm yêu thương của bạn.
          **etx <số tiền>** - Chơi tài xỉu, đặt cược số tiền.
          **eaddxu <số tiền>** - Thêm xu cho người dùng (admin only).
          **edelxu <số tiền>** - Xóa xu của người dùng (admin only).
          **eaddreply <từ khóa> <câu trả lời>** - Thêm câu trả lời tự động (admin only).
          **edelreply <từ khóa>** - Xóa câu trả lời tự động (admin only).
          **elistreply** - Hiển thị danh sách câu trả lời tự động (admin only).
          **etop** - Hiển thị bảng xếp hạng người dùng theo số dư xu.
        `,
      };
      return message.channel.send({ embeds: [embed] });
    }
  }
});

// Đăng nhập vào bot với token từ file .env
client.login(token);
