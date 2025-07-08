import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { 
  FaBirthdayCake, 
  FaRobot, 
  FaBell, 
  FaMobile, 
  FaUsers, 
  FaPlay,
  FaGithub,
  FaChevronDown,
  FaShare,
  FaPalette,
  FaRocket,
  FaComments,
  FaCalendarCheck,
  FaHeart
} from 'react-icons/fa';

function HomePage() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const features = [
    {
      icon: <FaRobot />,
      title: "AI-Powered Messages",
      description: "Generate personalized birthday messages using advanced AI that understands relationships and creates heartfelt content tailored to each person."
    },
    {
      icon: <FaBell />,
      title: "Smart Notifications",
      description: "Never miss a birthday with intelligent reminders sent at perfect times - 1 week, 1 day, 6 hours, and 1 hour before the special day."
    },
    {
      icon: <FaMobile />,
      title: "Progressive Web App",
      description: "Install on any device and enjoy native app experience with offline support and home screen access across all platforms."
    },
    {
      icon: <FaUsers />,
      title: "Relationship-Aware",
      description: "Messages adapt to your relationship - family, friends, colleagues, or romantic partners get appropriately toned messages."
    },
    {
      icon: <FaShare />,
      title: "Easy Sharing",
      description: "Share birthday messages instantly via WhatsApp, email, SMS, or copy to clipboard with one click for seamless communication."
    },
    {
      icon: <FaComments />,
      title: "AI Chat Assistant",
      description: "Add reminders through natural conversation with our AI assistant. Just chat naturally and it handles all the details."
    }
  ];

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  const scrollToFeatures = () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      lineHeight: 1.6,
      color: '#333'
    }}>
      {/* Hero Section */}
      <section style={{
        background: '#000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '800px',
          padding: '0 20px',
          zIndex: 2
        }}>
          <div style={{
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            marginBottom: '24px',
            animation: 'bounce 2s infinite'
          }}>
            🎂
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: '700',
            marginBottom: '24px',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            Birthday Remind
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
            marginBottom: '40px',
            opacity: 0.9,
            fontWeight: '300',
            maxWidth: '600px',
            margin: '0 auto 40px auto'
          }}>
            Never miss a special day again with AI-powered birthday reminders and personalized messages
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '60px'
          }}>
            <button
              onClick={handleGetStarted}
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                minWidth: '200px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 24px rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(255,255,255,0.1)';
              }}
            >
              <FaRocket /> Get Started Free
            </button>
            <button
              onClick={scrollToFeatures}
              style={{
                background: 'transparent',
                color: '#fff',
                border: '2px solid #fff',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                minWidth: '200px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#fff';
              }}
            >
              <FaPlay /> Learn More
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div 
          onClick={scrollToFeatures}
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            animation: 'bounce 2s infinite',
            opacity: 0.7
          }}
        >
          <FaChevronDown size={24} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: 'clamp(60px, 10vw, 100px) 20px',
        background: '#f8f9fa'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(60px, 8vw, 80px)' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: '700',
              marginBottom: '20px',
              color: '#000'
            }}>
              Powerful Features
            </h2>
            <p style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Everything you need to never miss another birthday, powered by cutting-edge AI technology
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'clamp(20px, 4vw, 40px)'
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  background: '#fff',
                  padding: 'clamp(24px, 5vw, 40px)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  border: '2px solid #000',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  color: '#000',
                  marginBottom: '20px'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#000'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#666',
                  lineHeight: '1.6',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        padding: 'clamp(60px, 10vw, 100px) 20px',
        background: '#fff'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(60px, 8vw, 80px)' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: '700',
              marginBottom: '20px',
              color: '#000'
            }}>
              How It Works
            </h2>
            <p style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(40px, 6vw, 60px)',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 'clamp(60px, 8vw, 80px)',
                height: 'clamp(60px, 8vw, 80px)',
                background: '#000',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                color: '#fff',
                margin: '0 auto 24px auto',
                fontWeight: '700'
              }}>
                1
              </div>
              <h3 style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#000'
              }}>
                Add Birthdays
              </h3>
              <p style={{
                color: '#666',
                lineHeight: '1.6',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)'
              }}>
                Simply chat with our AI assistant to add birthdays. Just tell us the name, date, and relationship - it's that easy.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 'clamp(60px, 8vw, 80px)',
                height: 'clamp(60px, 8vw, 80px)',
                background: '#000',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                color: '#fff',
                margin: '0 auto 24px auto',
                fontWeight: '700'
              }}>
                2
              </div>
              <h3 style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#000'
              }}>
                Get Notified
              </h3>
              <p style={{
                color: '#666',
                lineHeight: '1.6',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)'
              }}>
                Receive smart notifications at the perfect times - multiple reminders ensure you never miss a birthday.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 'clamp(60px, 8vw, 80px)',
                height: 'clamp(60px, 8vw, 80px)',
                background: '#000',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                color: '#fff',
                margin: '0 auto 24px auto',
                fontWeight: '700'
              }}>
                3
              </div>
              <h3 style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#000'
              }}>
                Share & Celebrate
              </h3>
              <p style={{
                color: '#666',
                lineHeight: '1.6',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)'
              }}>
                Use AI-generated personalized messages or create your own. Share instantly via any platform with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section style={{
        padding: 'clamp(60px, 10vw, 100px) 20px',
        background: '#f8f9fa'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '700',
            marginBottom: '20px',
            color: '#000'
          }}>
            What You Get
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: '#666',
            marginBottom: '60px'
          }}>
            A complete birthday management solution that keeps your relationships strong
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(20px, 4vw, 40px)',
            marginBottom: '60px'
          }}>
            <div style={{
              background: '#fff',
              padding: 'clamp(20px, 4vw, 30px)',
              borderRadius: '12px',
              border: '2px solid #000',
              textAlign: 'center'
            }}>
              <FaCalendarCheck style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: '#000', marginBottom: '16px' }} />
              <h4 style={{ color: '#000', marginBottom: '8px', fontSize: 'clamp(1rem, 2.5vw, 1.1rem)' }}>Smart Reminders</h4>
              <p style={{ color: '#666', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Multiple alerts before each birthday</p>
            </div>
            <div style={{
              background: '#fff',
              padding: 'clamp(20px, 4vw, 30px)',
              borderRadius: '12px',
              border: '2px solid #000',
              textAlign: 'center'
            }}>
              <FaRobot style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: '#000', marginBottom: '16px' }} />
              <h4 style={{ color: '#000', marginBottom: '8px', fontSize: 'clamp(1rem, 2.5vw, 1.1rem)' }}>AI Messages</h4>
              <p style={{ color: '#666', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Personalized birthday messages</p>
            </div>
            <div style={{
              background: '#fff',
              padding: 'clamp(20px, 4vw, 30px)',
              borderRadius: '12px',
              border: '2px solid #000',
              textAlign: 'center'
            }}>
              <FaMobile style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: '#000', marginBottom: '16px' }} />
              <h4 style={{ color: '#000', marginBottom: '8px', fontSize: 'clamp(1rem, 2.5vw, 1.1rem)' }}>Mobile App</h4>
              <p style={{ color: '#666', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Install on any device</p>
            </div>
            <div style={{
              background: '#fff',
              padding: 'clamp(20px, 4vw, 30px)',
              borderRadius: '12px',
              border: '2px solid #000',
              textAlign: 'center'
            }}>
              <FaHeart style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: '#000', marginBottom: '16px' }} />
              <h4 style={{ color: '#000', marginBottom: '8px', fontSize: 'clamp(1rem, 2.5vw, 1.1rem)' }}>Free Forever</h4>
              <p style={{ color: '#666', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>No hidden costs or subscriptions</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: 'clamp(60px, 10vw, 100px) 20px',
        background: '#000',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            fontSize: 'clamp(3rem, 8vw, 4rem)',
            marginBottom: '24px'
          }}>
            🎉
          </div>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '700',
            marginBottom: '24px'
          }}>
            Ready to Get Started?
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            marginBottom: '40px',
            opacity: 0.9
          }}>
            Start remembering every birthday and creating meaningful connections today.
          </p>
          <button
            onClick={handleGetStarted}
            style={{
              background: '#fff',
              color: '#000',
              border: 'none',
              padding: '20px 40px',
              borderRadius: '8px',
              fontSize: 'clamp(1rem, 3vw, 1.1rem)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(255,255,255,0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 24px rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(255,255,255,0.2)';
            }}
          >
            <FaBirthdayCake /> Start Free Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#000',
        color: '#fff',
        padding: 'clamp(40px, 6vw, 60px) 20px clamp(20px, 4vw, 40px)',
        textAlign: 'center',
        borderTop: '1px solid #333'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <FaBirthdayCake style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#fff' }} />
            <h3 style={{
              fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
              fontWeight: '700',
              margin: 0
            }}>
              Birthday Remind
            </h3>
          </div>
          
          <p style={{
            color: '#ccc',
            marginBottom: '30px',
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)'
          }}>
            Never miss a special day again
          </p>

          <div style={{
            borderTop: '1px solid #333',
            paddingTop: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <p style={{
              color: '#666',
              margin: 0,
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
            }}>
              © 2024 Birthday Remind. All rights reserved.
            </p>
            <div style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'center'
            }}>
              <a 
                href="https://github.com/kavya-gupta-3/Birthday-Reminder" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#ccc',
                  fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#fff'}
                onMouseLeave={(e) => e.target.style.color = '#ccc'}
              >
                <FaGithub />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 60%, 100% { transform: translateY(0); }
          40%, 80% { transform: translateY(-10px); }
        }
        
        @media (max-width: 768px) {
          section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          section {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePage; 