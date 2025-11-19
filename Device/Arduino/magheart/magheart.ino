// ESP32 Arduino Core 3.0+ 新版 PWM 写法
const int pwmPin = 5;     // PWM 输出引脚
const int freq = 5000;    // PWM 频率 (Hz)
const int resolution = 8; // 分辨率：8位 (0-255)

// 心跳模拟参数
int heartRate = 0;              // 心率 (BPM)
unsigned long beatInterval = 0; // 每次心跳的间隔时间 (ms)
unsigned long lastBeatTime = 0; // 上次心跳的时间
bool isBeating = false;         // 当前是否在心跳周期中
bool isPeak = false;            // 当前是否在高峰期（收缩期）

// PWM 值定义
const int PWM_PEAK = 255; // 5挡 - 心跳高峰（收缩期）100%
const int PWM_VALLEY = 153; // 3挡 - 心跳低谷（舒张期）60%
// const int PWM_VALLEY = 204; // 4挡 - 心跳低谷（舒张期）80%
const int PWM_OFF = 0;      // 0挡 - 关闭

//  【0，51，102，153，204，255】

// 心跳周期时间分配（百分比）
const float SYSTOLE_RATIO = 0.35;  // 收缩期占35%
const float DIASTOLE_RATIO = 0.65; // 舒张期占65%

unsigned long systoleDuration = 0;  // 收缩期持续时间
unsigned long diastoleDuration = 0; // 舒张期持续时间
unsigned long phaseStartTime = 0;   // 当前阶段开始时间

void setup()
{
  Serial.begin(115200);

  // 新版 API：直接配置引脚
  ledcAttach(pwmPin, freq, resolution);

  // 初始输出为 0
  ledcWrite(pwmPin, PWM_OFF);

  Serial.println("=================================");
  Serial.println("ESP32 心跳磁力模拟器");
  Serial.println("=================================");
  Serial.println("输入心率 (40-200 BPM) 开始模拟心跳");
  Serial.println("输入 0 停止心跳模拟");
  Serial.println("5挡=心跳高峰(收缩期), 3挡=心跳低谷(舒张期)");
  Serial.println("=================================");
}

void loop()
{
  // 处理串口输入
  if (Serial.available() > 0)
  {
    String input = Serial.readStringUntil('\n');
    input.trim();

    int bpm = input.toInt();

    if (bpm == 0)
    {
      // 停止心跳模拟
      heartRate = 0;
      isBeating = false;
      ledcWrite(pwmPin, PWM_OFF);
      Serial.println("❌ 心跳模拟已停止");
    }
    else if (bpm >= 40 && bpm <= 200)
    {
      // 设置新的心率
      heartRate = bpm;
      beatInterval = 60000 / heartRate; // 每次心跳的总时间 (ms)

      // 计算收缩期和舒张期的持续时间
      systoleDuration = beatInterval * SYSTOLE_RATIO;
      diastoleDuration = beatInterval * DIASTOLE_RATIO;

      // 重置心跳状态
      isBeating = true;
      isPeak = true;
      lastBeatTime = millis();
      phaseStartTime = millis();

      // 立即开始心跳高峰
      ledcWrite(pwmPin, PWM_PEAK);

      Serial.println("=================================");
      Serial.print("✅ 心率设置为: ");
      Serial.print(heartRate);
      Serial.println(" BPM");
      Serial.print("   心跳周期: ");
      Serial.print(beatInterval);
      Serial.println(" ms");
      Serial.print("   收缩期: ");
      Serial.print(systoleDuration);
      Serial.println(" ms (5挡)");
      Serial.print("   舒张期: ");
      Serial.print(diastoleDuration);
      Serial.println(" ms (3挡)");
      Serial.println("=================================");
    }
    else
    {
      Serial.println("⚠️  请输入有效的心率值 (40-200 BPM) 或 0 停止");
    }
  }

  // 心跳模拟逻辑
  if (isBeating && heartRate > 0)
  {
    unsigned long currentTime = millis();
    unsigned long elapsed = currentTime - phaseStartTime;

    if (isPeak)
    {
      // 当前在收缩期（高峰）
      if (elapsed >= systoleDuration)
      {
        // 切换到舒张期（低谷）
        isPeak = false;
        phaseStartTime = currentTime;
        ledcWrite(pwmPin, PWM_VALLEY);
        Serial.print("💓 跳动... | BPM: ");
        Serial.println(heartRate);
      }
    }
    else
    {
      // 当前在舒张期（低谷）
      if (elapsed >= diastoleDuration)
      {
        // 切换到下一次收缩期（高峰）
        isPeak = true;
        phaseStartTime = currentTime;
        ledcWrite(pwmPin, PWM_PEAK);
      }
    }
  }
}